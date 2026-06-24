from collections import defaultdict
from datetime import timedelta
from django.utils import timezone

def get_period_config(period, now):
    if period == 'weekly':
        start_date = (now - timedelta(days=6)).date()
        all_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        ordered = [all_days[(now.weekday() - 6 + i) % 7] for i in range(7)]
        
    elif period == 'monthly':
        start_date = now.date().replace(day=1)
        ordered = ['1-7', '8-15', '16-23', '24-31']
    else:
        start_date = now.date().replace(month=1, day=1)
        all_months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        ordered = all_months[:now.month]
    return start_date, ordered

def get_label(d, p):
    if p == 'weekly': return d.strftime('%a')
    if p == 'monthly':
        day = d.day
        if day <= 7: return '1-7'
        if day <= 15: return '8-15'
        if day <= 23: return '16-23'
        return '24-31'
    return d.strftime('%b')

def round_to_100(values: dict) -> dict:
    if not values: return values
    floored = {k: int(v) for k, v in values.items()}
    remainders = {k: v - int(v) for k, v in values.items()}
    deficit = 100 - sum(floored.values())
    for k in sorted(remainders, key=remainders.get, reverse=True)[:deficit]:
        floored[k] += 1
    return floored

def process_emotion_statistics(period_emotions, period, ordered):
    valid_emotions = [e for e in period_emotions if e.get('intensity', 0) > 0]

    totals = defaultdict(float)
    buckets = defaultdict(lambda: defaultdict(float))

    for e in valid_emotions:
        totals[e['name']] += e['intensity']
        label = get_label(e['date'], period)
        buckets[label][e['name']] += e['intensity']

    top5 = sorted(totals, key=totals.get, reverse=True)[:5]
    if not top5:
        return {'emotions': [], 'data': []}

    data = []
    for label in ordered:
        bucket = buckets.get(label, {})
        total = sum(bucket.values())
        row = {'label': label}

        if total > 0:
            raw = {name: (bucket.get(name, 0) / total) * 100 for name in top5}
            others_val = sum(v for k, v in bucket.items() if k not in top5)
            raw['Others'] = (others_val / total) * 100
            row.update(round_to_100(raw))
        else:
            for name in top5:
                row[name] = 0
            row['Others'] = 0
        data.append(row)

    return {'emotions': top5, 'data': data}