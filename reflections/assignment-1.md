# Assignment 1 reflection

**The breakthrough** was realizing that "physically honest" isn't something an
agent can verify for me — it's something I have to verify myself, by hand,
before I let a model ship. The agent produced a drag curve that looked
reasonable at a glance (numbers, units, a plausible shape near stall) but was
quietly wrong past it: drag fell as angle kept rising, which can't happen once
the flow has separated. I only caught it because I made myself read the actual
numbers in a table instead of trusting that "it compiles and the chart looks
smooth" meant the physics was right. Once I found it, the fix wasn't a bigger
prompt — it was tracing the formula by hand, confirming the failure
numerically, and then writing a regression test that pins the shape down
permanently (`dragPastStall >= dragAtStall`), so the same mistake can't quietly
come back in a later refactor.

**What this changed about who I want to be as a developer**: I used to treat
"does it look right" as close enough to "is it right." This assignment made
the gap between those two very concrete — a chart can look smooth and still
encode a lie. Going forward, wherever I build something that models a
real-world process, I want the habit to be: derive the expected shape myself
first, in plain terms I could explain to someone else, and only then check the
code against that — not the other way around. The agent is fast at producing
a plausible answer; I'm the one who has to know what "plausible" is supposed
to mean here.
