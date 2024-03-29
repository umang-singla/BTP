import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

df = pd.read_parquet('yellow_tripdata_2023-01 (1).parquet', engine='pyarrow')
# df.to_csv('yellow_tripdata_2013-01.csv')

pickup_point = set()
dropoff_point = set()

datapoints = {}

dt = datetime(2023, 1, 1)

for i in range(0, 24):
    datapoints[i] = 0

for ind in df.index:
    pickup_point.add(df["PULocationID"][ind])
    dropoff_point.add(df["DOLocationID"][ind])
    dt = pd.to_datetime(str(df["tpep_pickup_datetime"][ind]))
    # print(dt.hour)
    if dt.hour in datapoints.keys():
        datapoints[dt.hour] += 1

print("Max index of Pickup Point",max(pickup_point))
print("Max index of Dropoff Point",max(dropoff_point))

x = []
y = []

for p, q in datapoints.items():
    x.append(p)
    y.append(q)

xdf = pd.DataFrame(x)
ydf = pd.DataFrame(y)

result = pd.concat([xdf, ydf], axis=1)

result.to_csv("date_vs_count.csv")


plt.plot(x, y)
plt.show()

