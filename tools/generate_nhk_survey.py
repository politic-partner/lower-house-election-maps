import paths
import utils
import json
import nhk_survey_scales

question_id2questions = {
    question["id"]: question
    for _prefecture_id, prefecture_questions in json.loads(
        (paths.nhk_dir / "18852questions.json").read_text(encoding="utf-8")
    ).items()
    for question in prefecture_questions
}

for question in question_id2questions.values():
    question["selects"] = [
        s.replace("<br class='pc-only'>", "") for s in question["selects"]
    ]


nhk_survey = {
    "candidates": {},
    "questions": question_id2questions,
}


for survey_json_file in paths.nhk_dir.glob("*.json"):
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
            "answers": {},
            "scales": {},
        }
        nhk_survey["candidates"][candidate_id] = candidate_answers

        for qa in candidate_survey["qa"]:
            question_id = qa["id"]
            answers = qa["answers"]
            question = question_id2questions[question_id]
            question_type = question["type"]
            options: list[str] = question["selects"]

            if question_type != 1:
                # 自由記述質問タイプ
                continue

            try:
                candidate_answers[question_id] = options.index(answers[0])
            except IndexError:
                # 未回答
                candidate_answers[question_id] = -1
            except ValueError:
                print(
                    f'{district_id}\t{candidate_survey["lastname"]}{candidate_survey["firstname"]}\t{question_id}\t{question["title"]}\t{answers[0]}'
                )


paths.nhk_survey_json_file.write_text(
    json.dumps(utils.normalize(nhk_survey), ensure_ascii=False, indent=2),
    encoding="utf-8",
)
