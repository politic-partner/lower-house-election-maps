import dataclasses
import unicodedata


def normalize(o, precision=3):
    if isinstance(o, float):
        return round(o, precision)
    if isinstance(o, dict):
        return {k: normalize(v, precision) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [normalize(x, precision) for x in o]
    if isinstance(o, str):
        return unicodedata.normalize("NFKC", o)
    if dataclasses.is_dataclass(o):
        return normalize(dataclasses.asdict(o), precision)

    return o
