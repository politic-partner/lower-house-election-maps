import paths
import utils
import json
import itertools

category_id2question_ids = {
    "重点政策分野": ["0"],
    "政治改革": ["1", "2", "3"],
    "経済・財政政策": ["4", "5", "6"],
    "社会政策": ["7", "8", "9", "10", "11"],
    "防衛・安全保障・憲法改正": ["12", "13", "14", "15", "16", "17"],
    "エネルギー政策": ["20", "21"],
    "皇室制度・家族・社会制度": ["18", "19", "22", "23", "24"],
}

question_id2category_id = {
    qid: cid
    for cid, qids in category_id2question_ids.items()
    for qid in qids
}

question_id2questions = {
    q["id"]: {
        "id":q["id"],
        "title":q["title"],
        "question":q["question"],
        "selects":q["selects"],
    }
    for prefecture_id, prefecture_questions in json.loads(
        (paths.nhk_survey_dir / "18852questions.json").read_text(encoding="utf-8")
    ).items()
    if prefecture_id == "00"
    for q in prefecture_questions
    if q["type"] == 1
}

for question in question_id2questions.values():
    question["selects"] = [
        s.replace("<br class='pc-only'>", "") for s in question["selects"]
    ]

nhk_survey = {
    "candidates": {},
    "questions": question_id2questions,
    "categories": category_id2question_ids,
}

for survey_json_file in paths.nhk_survey_dir.glob("*.json"):
    if survey_json_file.stem == "18852questions":
        continue

    district_id = survey_json_file.stem
    try:
        survey = json.loads(survey_json_file.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print(f"Error in {district_id}")
        continue

    for candidate_survey in survey:
        candidate_id = str(candidate_survey["candidateID"])
        candidate_answers = {
            "a": {},
            "s": {},
        }
        nhk_survey["candidates"][candidate_id] = candidate_answers

        for qa in candidate_survey["qa"]:
            question_id = qa["id"]
            question = question_id2questions.get(question_id)
            if question is None:
                continue

            answers = qa["answers"]
            options: list[str] = question["selects"]

            try:
                candidate_answers["a"][question_id] = options.index(answers[0])
            except IndexError:
                # 未回答
                candidate_answers["a"][question_id] = -1
            except ValueError:
                print(
                    f'{district_id}\t{candidate_survey["lastname"]}{candidate_survey["firstname"]}\t{question_id}\t{question["title"]}\t{answers[0]}'
                )


paths.nhk_survey_json_file.write_text(
    json.dumps(utils.normalize(nhk_survey), ensure_ascii=False, indent=2),
    encoding="utf-8",
)
