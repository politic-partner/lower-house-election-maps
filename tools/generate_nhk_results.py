import json
import xml.etree.ElementTree

import paths
import utils

results = {
    "candidates": {},
    "districts": {},
    "blocks": {},
}

candidates = json.loads(paths.candidates_json_file.read_text(encoding="utf-8"))

# 小選挙区
for district_xml_path in paths.nhk_results_dir.glob("skh*.xml"):
    nhkel = xml.etree.ElementTree.parse(district_xml_path).getroot()
    for senk in nhkel.findall("senk"):
        district_id = senk.attrib["senkId"]
        district_candidates = {
            kh.attrib["khId"]: {
                "id": kh.attrib["khId"],
                "votes": int(kh.attrib["hyo"]),
                "rate": float(kh.attrib["hyoRate"]) / 100,
            }
            for kh in senk.findall("kh")
        }
        results["candidates"].update(district_candidates)

        won_candidate_el = next(
            iter(
                filter(
                    lambda kh: kh.attrib["senkTstkSts"] == "1",
                    senk.findall("kh"),
                )
            )
        )

        results["districts"][district_id] = {
            "id": district_id,
            "voters": int(senk.attrib["elctorSu"]),
            "turnout": float(senk.attrib["vtRate"]) / 100,
            "won_cid": won_candidate_el.attrib["khId"],
            "won_rate": float(won_candidate_el.attrib["hyoRate"]) / 100,
            "candidate_votes": {
                cid: c["votes"] for cid, c in district_candidates.items()
            },
            "areas": {},
        }

        for area in nhkel.findall("plc"):
            area_candidate_votes = {}
            area_total_votes = 0
            area_candidate_max_votes = 0
            area_won_candidate = {"cid": None, "votes": 0}
            for area_candidate in area.findall("plcKh"):
                area_candidate_id = area_candidate.attrib["khId"]
                area_candidate_vote = int(area_candidate.attrib["hyo"])
                area_candidate_votes[area_candidate_id] = area_candidate_vote
                area_total_votes += area_candidate_vote
                if area_candidate_vote > area_candidate_max_votes:
                    area_candidate_max_votes = area_candidate_vote
                    area_won_candidate = {
                        "cid": area_candidate_id,
                        "votes": area_candidate_vote,
                    }

            area_details = {
                "voters": int(area.attrib["elctorSu"]),
                "turnout": float(area.attrib["vtRate"]) / 100,
                "won_cid": area_won_candidate["cid"],
                "won_rate": area_won_candidate["votes"] / area_total_votes,
                "candidate_votes": area_candidate_votes,
            }

            results["districts"][district_id]["areas"][area.attrib["plcNm"]] = (
                area_details
            )

paths.nhk_results_json_file.write_text(
    json.dumps(utils.normalize(results), ensure_ascii=False, indent=2)
)
