import csv
import dataclasses
import json
import xml.etree.ElementTree
from typing import Optional

import paths
import utils

district_id2areas = {
    r[0]: r[1]
    for r in csv.reader(
        (paths.nhk_dir / "senkDtl.csv").read_text(encoding="utf-8").splitlines()
    )
}


@dataclasses.dataclass
class Party:
    id: str
    name: str
    name_full: str
    ruling: bool
    color: str
    block_candidate_count: int = 0


@dataclasses.dataclass
class Candidate:
    id: str
    name: str
    name_kana: str
    pid: str
    age: int
    status: str
    win_count: int
    did: Optional[str]
    bid: Optional[str]
    endorser: str
    supporter: str
    titles: list[str]

    """https://www.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/photo/{face_image}"""
    face_image: str

    @property
    def dual_run(self) -> bool:
        return (self.did is not None) and (self.bid is not None)


@dataclasses.dataclass
class District:
    id: str
    name: str
    code: str
    prefecture: str
    bid: str
    quota: int
    areas: list[str]
    cids: list[str]


@dataclasses.dataclass
class PartyListElement:
    order: int
    cid: str


@dataclasses.dataclass
class Block:
    id: str
    name: str
    quota: int
    parties: dict[str, list[PartyListElement]]


party_id2party = {
    line[1]: Party(
        id=line[1],
        name=line[2],
        name_full=line[4],
        ruling=line[5] == "1",
        color=line[6] if len(line) > 6 else "#666666",
    )
    for line in csv.reader(
        (paths.nhk_dir / "stindex.csv").read_text(encoding="utf-8").splitlines()[1:]
    )
}

name2parties = {p.name: p for p in party_id2party.values()}

districts = {}
candidates = {}
blocks = {}


def to_candidate(
    element: xml.etree.ElementTree.Element,
    district_id: Optional[str],
    block_id: Optional[str],
    party_id: Optional[str] = None,
) -> Candidate:
    return Candidate(
        id=element.attrib["khId"],
        name=element.text,
        name_kana=element.attrib["khNmKana"],
        pid=party_id or name2parties[element.attrib["prtyNm"]].id,
        age=int(element.attrib["age"]),
        status=element.attrib["zmskNm"],
        win_count=int(element.attrib["tsKaisu"]),
        did=district_id,
        bid=block_id,
        endorser=element.attrib.get("rcmmPrty", ""),
        supporter=element.attrib.get("support", ""),
        titles=list(
            filter(
                None,
                (element.attrib.get(p) for p in ("prof1", "prof2", "prof3")),
            )
        ),
        face_image=element.attrib["kao"],
    )


# 小選挙区
for xml_path in sorted(paths.nhk_dir.glob("skh*.xml")):
    nhkel = xml.etree.ElementTree.parse(xml_path).getroot()
    for senk in nhkel.findall("senk"):
        district_id = senk.attrib["senkId"]
        district_code = (
            f"{int(nhkel.attrib['nhkPftCd']):02}{int(senk.attrib['dispOdr']):02}"
        )

        district_candidates = [
            to_candidate(kh, district_id, None) for kh in senk.findall("kh")
        ]

        candidates.update((c.id, c) for c in district_candidates)

        districts[district_id] = District(
            id=senk.attrib["senkId"],
            name=senk.attrib["senkNm"],
            code=district_code,
            prefecture=nhkel.attrib["pftNm"],
            bid=nhkel.attrib["hrBlkCd"],
            quota=int(senk.attrib["teiin"]),
            areas=[
                a.strip() for a in district_id2areas[senk.attrib["senkId"]].split("、")
            ],
            cids=[c.id for c in district_candidates],
        )

# 比例代表
for xml_path in sorted(paths.nhk_dir.glob("hmb*.xml")):
    nhkel = xml.etree.ElementTree.parse(xml_path).getroot()
    hrBlk = nhkel.find("hrBlk")
    block_id = hrBlk.attrib["hrBlkCd"]
    block_name = hrBlk.attrib["hrBlkNm"]
    block_quota = int(hrBlk.attrib["teiin"])

    prty = nhkel.find("prty")
    party_id = prty.attrib["prtyId"]

    block_partylist = []

    for meibo in prty.findall("meibo"):
        candidate_id = meibo.attrib["khId"]
        if candidate_id in candidates:
            candidate = candidates[candidate_id]
        else:
            candidate = to_candidate(meibo, None, block_id, party_id=party_id)
            candidates[candidate_id] = candidate

        candidate.bid = block_id
        block_partylist.append(
            PartyListElement(order=int(meibo.attrib["hrMeiboOdr"]), cid=candidate_id)
        )

    if block_id in blocks:
        blocks[block_id].parties[party_id] = block_partylist
    else:
        blocks[block_id] = Block(
            id=block_id,
            name=block_name,
            quota=block_quota,
            parties={party_id: block_partylist},
        )

paths.districts_json_file.write_text(
    json.dumps(
        utils.normalize(dict(sorted(districts.items(), key=lambda e: e[1].code))),
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

paths.candidates_json_file.write_text(
    json.dumps(
        utils.normalize(dict(sorted(candidates.items(), key=lambda e: int(e[1].id)))),
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

paths.blocks_json_file.write_text(
    json.dumps(
        utils.normalize(dict(sorted(blocks.items(), key=lambda e: e[1].id))),
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)


# fill block_candidate_count
for party in party_id2party.values():
    party.block_candidate_count = sum(
        len(block.parties.get(party.id, [])) for block in blocks.values()
    )

paths.parties_json_file.write_text(
    json.dumps(
        utils.normalize(party_id2party),
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
