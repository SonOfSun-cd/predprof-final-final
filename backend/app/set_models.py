from database import engine, Base, context_manager
from models import API
from requests import get
from json import *

done = False
url='http://couldntcareless.ru/ppo_it_final'
response = get(url)
if response.status_code == 200:
    data=response.json()
else:
    print(f"Ошибка: { response.status_code}")    

with context_manager() as db:
    for i in range(len(data)):
        print(i)
        new_api=API(distant=data[i][0], SH=data[i][1])
        db.add(new_api)

    done = True
