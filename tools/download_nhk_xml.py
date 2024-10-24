import requests
import csv
from pathlib import Path

import xml.etree.ElementTree


def download(url: str, path: Path):
    response = requests.get(url)
    response.raise_for_status()
    path.write_bytes(response.content)


def get_response_body(url: str):
    response = requests.get(url)
    response.raise_for_status()
    return response.content


tools_dir = Path(__file__).parent
nhk_dir = tools_dir / "data" / "nhk"
sindex_csv_path = nhk_dir / "sindex.csv"

# 小選挙区
for record in csv.reader(sindex_csv_path.read_text(encoding="utf-8").splitlines()):
    # skip header
    if record[0] == "選挙種別ID":
        continue

    district_id = record[3]
    download(
        f"https://www.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ko/skh{district_id}.xml",
        nhk_dir / f"skh{district_id}.xml",
    )

# 比例代表
for block_id in ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"]:
    xml_root = xml.etree.ElementTree.fromstring(
        get_response_body(
            f"https://www.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ko/menub{block_id}.xml"
        )
    )
    party_ids = [prty.attrib["prtyId"] for prty in xml_root.findall("prty")]

    for party_id in party_ids:
        download(
            f"https://www.nhk.or.jp/senkyo-data/database/shugiin/2024/00/18852/xml/ko/hmb{block_id}_{party_id}.xml",
            nhk_dir / f"hmb{block_id}_{party_id}.xml",
        )
