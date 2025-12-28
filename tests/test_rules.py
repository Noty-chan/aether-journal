from domain.rules import StatPointRule, XPCurveExponential


def test_xp_curve_exponential():
    curve = XPCurveExponential(base_xp=200, growth_rate=1.25)
    assert curve.xp_to_next(1) == 200
    assert curve.xp_to_next(2) == 250
    assert curve.xp_to_next(3) == 312


def test_stat_point_rule_levels():
    rule = StatPointRule()
    assert rule.points_on_level(1) == 5
    assert rule.points_on_level(5) == 7
    assert rule.points_on_level(10) == 8


def test_stat_points_for_range():
    rule = StatPointRule()
    assert rule.points_for_range(1, 4) == 15
    assert rule.points_for_range(4, 6) == 12
