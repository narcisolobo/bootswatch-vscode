"""Python sample: decorators, self, logical keyword operators, f-strings."""
import re
from dataclasses import dataclass, field

HEX = re.compile(r"^#[0-9a-f]{6}$", re.I)


@dataclass
class Theme:
    name: str
    dark: bool = False
    colors: dict[str, str] = field(default_factory=dict)

    def label(self) -> str:
        return f"Bootswatch {self.name.title()}{' (dark)' if self.dark else ''}"

    def valid(self) -> bool:
        return bool(self.colors) and all(HEX.match(c) for c in self.colors.values())


def ratio(a: float, b: float, *, floor=4.5, **extra) -> float | None:
    if a is None or not b:
        return None
    lighter, darker = max(a, b), min(a, b)
    result = (lighter + 0.05) / (darker + 0.05)
    return result if result >= floor else None


if __name__ == "__main__":
    t = Theme("flatly", colors={"primary": "#2c3e50"})
    print(t.label(), t.valid(), ratio(1.0, 0.0), True, False)
