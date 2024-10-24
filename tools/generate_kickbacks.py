import csv
import itertools
import json
from operator import itemgetter

import paths
import utils
import random

candidates = json.loads(paths.candidates_json_file.read_text(encoding="utf-8"))


duplicate_names = set(
    n
    for n, cs in itertools.groupby(
        sorted(candidates.values(), key=itemgetter("name")), key=itemgetter("name")
    )
    if len(list(cs)) > 1
)

name2candidates = {candidate["name"]: candidate for candidate in candidates.values()}

districts = json.loads(paths.districts_json_file.read_text(encoding="utf-8"))
name2districts = {district["name"]: district for district in districts.values()}


blocks = json.loads(paths.blocks_json_file.read_text(encoding="utf-8"))
name2blocks = {block["name"]: block for block in blocks.values()}

kickbacks = {
    "details": {},
    "candidates": {},
    "blocks": {},
    "not_runs": {"districts": {}, "blocks": {}},
}

name2kickback_faces = {
    line[0]: line[1]
    for line in csv.reader(
        paths.kickback_faces_tsv_file.read_text(encoding="utf-8").splitlines(),
        delimiter="\t",
    )
}

for kickback_id, line in enumerate(
    sorted(
        csv.reader(
            paths.kickbacks_tsv_file.read_text(encoding="utf-8").splitlines(),
            delimiter="\t",
        ),
        key=lambda x: int(x[7].replace("万円", "")),
        reverse=True,
    )
):
    line = utils.normalize(line)
    if line[5] == "参":
        continue

    kickback_id = f"{kickback_id:03}"

    name = line[0]
    status = line[1]
    district_names = line[3:5]
    kickback_amount = int(line[7].replace("万円", ""))
    news_url = line[9]

    districts = [name2districts[d] for d in district_names if d in name2districts]
    blocks = [name2blocks[d[2:]] for d in district_names if d[2:] in name2blocks]

    kickback = {
        "id": kickback_id,
        "name": name,
        "status": status,
        "amount": kickback_amount,
        "face_url": name2kickback_faces.get(name.replace(" ", "")),
    }

    kickbacks["details"][kickback_id] = kickback
    for block in blocks:
        kickbacks["blocks"].setdefault(block["id"], 0)
        kickbacks["blocks"][block["id"]] += kickback_amount

    if name in name2candidates:
        kickback["face_url"] = None
        kickbacks["candidates"][name2candidates[name]["id"]] = kickback_id
        continue

    if len(districts) == len(blocks) == 0:
        print(f"skip: {district_names} {name}")
        continue

    for district in districts:
        kickbacks["not_runs"]["districts"].setdefault(district["id"], []).append(
            kickback_id
        )

    for block in blocks:
        kickbacks["not_runs"]["blocks"].setdefault(block["id"], []).append(kickback_id)

district_id2positions = {
    did: next(dps)["p"]
    for did, dps in itertools.groupby(
        sorted(
            json.loads(
                paths.layer_text_district_names_json_file.read_text(encoding="utf-8")
            ),
            key=lambda e: int(e["d"]) * 100 + e["a"],
            reverse=True,
        ),
        key=lambda e: e["d"],
    )
}

block_id2positions = {
    bp["b"]: bp["p"]
    for bp in json.loads(
        paths.layer_text_block_names_json_file.read_text(encoding="utf-8")
    )
}

paths.kickbacks_json_file.write_text(
    json.dumps(kickbacks, ensure_ascii=False, indent=2),
    encoding="utf-8",
)


def randomize_position(position: list[float], scale: float) -> list[float]:
    return utils.normalize(
        [
            position[0] + ((random.random() + random.random() - 1) * scale),
            position[1] + ((random.random() + random.random() - 1) * scale),
        ]
    )


paths.layer_icon_district_kickbacks_json_file.write_text(
    json.dumps(
        [
            {
                "a": sum(kickbacks["details"][kid]["amount"] for kid in kids),
                "p": district_id2positions[did],
            }
            for did, kids in itertools.chain(
                kickbacks["not_runs"]["districts"].items(),
                (
                    (candidates[cid]["did"], [kid])
                    for cid, kid in kickbacks["candidates"].items()
                    if candidates[cid]["did"] is not None
                ),
            )
        ],
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)


paths.layer_icon_block_kickbacks_json_file.write_text(
    json.dumps(
        [
            {
                "a": sum(kickbacks["details"][kid]["amount"] for kid in kids),
                "p": block_id2positions[bid],
            }
            for bid, kids in kickbacks["not_runs"]["blocks"].items()
        ],
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
