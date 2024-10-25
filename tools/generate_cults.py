import csv
import itertools
import json
from operator import itemgetter

import paths
import utils

kickbacks = json.loads(paths.kickbacks_json_file.read_text(encoding="utf-8"))
name2kickback_ids = {
    kickback["name"].replace(" ", ""): kickback_id
    for kickback_id, kickback in kickbacks["details"].items()
}
candidates = json.loads(paths.candidates_json_file.read_text(encoding="utf-8"))


duplicate_names = set(
    n
    for n, cs in itertools.groupby(
        sorted(candidates.values(), key=itemgetter("name")), key=itemgetter("name")
    )
    if len(list(cs)) > 1
)

name2candidates = {
    candidate["name"].replace(" ", ""): candidate for candidate in candidates.values()
}

cults = {
    "candidates": {},
    "kickbacks": {},
}

notable_cult = "統一教会"

for line in csv.reader(
    paths.cults_tsv_file.read_text(encoding="utf-8").splitlines(),
    delimiter="\t",
):
    line = utils.normalize(line)
    name = line[0]
    cult_point = int(line[1])
    links = line[2].split(" ")

    if notable_cult in links:
        links.remove(notable_cult)
        links.insert(0, notable_cult)

    cult = {
        "name": name,
        "point": cult_point,
        "links": links,
    }

    if name in name2candidates:
        cults["candidates"][name2candidates[name]["id"]] = cult
        continue

    if name in name2kickback_ids:
        cults["kickbacks"][name2kickback_ids[name]] = cult
        continue

    print(f"Unknown candidate or kickback: {name}")

for line in csv.reader(
    paths.moonies_tsv_file.read_text(encoding="utf-8").splitlines(),
    delimiter="\t",
):
    line = utils.normalize(line)
    name = line[0]

    if name in name2candidates:
        if name2candidates[name]["id"] not in cults["candidates"]:
            cults["candidates"][name2candidates[name]["id"]] = {
                "name": name,
                "point": None,
                "links": [notable_cult],
            }
        else:
            links = cults["candidates"][name2candidates[name]["id"]]["links"]
            if notable_cult in links:
                links.remove(notable_cult)
            links.insert(0, notable_cult)

        continue

    print(f"Unknown candidate: {name}")

paths.cults_json_file.write_text(
    json.dumps(cults, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
