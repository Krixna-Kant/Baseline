import numpy as np

from baseline_lab.dif import mantel_haenszel
from baseline_lab.generator import generate
from baseline_lab.metrics import icc_2_1


def test_cohort_reproducible_from_seed():
    a = generate(300, seed=5)
    b = generate(300, seed=5)
    assert np.array_equal(a.inp.scores, b.inp.scores, equal_nan=True)
    assert a.people.equals(b.people)
    c = generate(300, seed=6)
    assert not np.array_equal(a.inp.scores, c.inp.scores, equal_nan=True)


def test_icc_matches_known_values():
    # Shrout and Fleiss (1979) table 2 data, ICC(2,1) = 0.29
    x = np.array([[9, 2, 5, 8], [6, 1, 3, 2], [8, 4, 6, 8], [7, 1, 2, 6], [10, 5, 6, 9], [6, 2, 4, 7]], float)
    assert abs(icc_2_1(x) - 0.29) < 0.01


def test_mantel_haenszel_calibrated_without_dif():
    rng = np.random.default_rng(0)
    n = 20000
    stratum = rng.integers(0, 5, n)
    focal = rng.random(n) < 0.5
    p = 1 / (1 + np.exp(-(stratum - 2) * 0.8))
    y = rng.random(n) < p
    assert mantel_haenszel(y, focal, stratum)["p"] > 0.01
    y_dif = rng.random(n) < np.where(focal, p * 0.7, p)
    assert mantel_haenszel(y_dif, focal, stratum)["p"] < 1e-6
