# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.1](https://github.com/AlexeyPahomov/coffer/compare/v1.2.0...v1.2.1) (2026-06-23)


### Bug Fixes

* размер списка ковертов и скролл истории ([1aedc7c](https://github.com/AlexeyPahomov/coffer/commit/1aedc7c7fe6a76a5188df6dfdcb41d413db8426d))
* расчёт конвертов ([d461c69](https://github.com/AlexeyPahomov/coffer/commit/d461c6997fd9836c333b2a3f9bcff3d7c0f29c7b))
* расчёт конвертов ([05271bc](https://github.com/AlexeyPahomov/coffer/commit/05271bc84548e003ceda98e59d07c334a2fe8fc9))
* расчёт свободного пула ([3c1da72](https://github.com/AlexeyPahomov/coffer/commit/3c1da724a2c9d453c906681b8ad94d7ba168496b))
* удаление плана вместо отмены ([d7e4a29](https://github.com/AlexeyPahomov/coffer/commit/d7e4a29149fce122ede3d1bbc9c0ced2f198bd03))
* формат дат планов ([ddefd8b](https://github.com/AlexeyPahomov/coffer/commit/ddefd8b8537e4cd5a0c1a34f48d0c172d3bf7879))

## [1.2.0](https://github.com/AlexeyPahomov/coffer/compare/v1.1.0...v1.2.0) (2026-06-19)


### Features

* начинаем переход на модель Транзакции → Конверты (категории) → Правила распределения → Прогнозы ([199be5b](https://github.com/AlexeyPahomov/coffer/commit/199be5b2518fd16d0ee1a421b83b819330bc6e12))
* новая логика расчёта и переноса остатков ([5b41d4d](https://github.com/AlexeyPahomov/coffer/commit/5b41d4ddf293eb3f706db09a07a2c3735d5ae53a))
* обернуть конверты и историю в табе на десктопе ([5a3afd1](https://github.com/AlexeyPahomov/coffer/commit/5a3afd11553648d0e7ba6108e8c1d2f6b2f4160c))
* проведение расхода резерва ([ea77cc9](https://github.com/AlexeyPahomov/coffer/commit/ea77cc97238a3652234ee1ee32838eefac3240d7))
* распределение дохода по шаблонам ([8421669](https://github.com/AlexeyPahomov/coffer/commit/84216690a5ddfd6d4b8d70038b6beb1e41f9e3b4))
* расходы по фактическим остаткам ([ff0fd6b](https://github.com/AlexeyPahomov/coffer/commit/ff0fd6be008fa07f5c7a9e8e8d53e608c401a842))
* текущий месяц считать после получения первой зп в нём ([d018dc6](https://github.com/AlexeyPahomov/coffer/commit/d018dc649e32ce32a7a653a223fedc93bef55499))
* шаблоны распределения и preview применения после получения дохода ([f3d984c](https://github.com/AlexeyPahomov/coffer/commit/f3d984c4226424b63d4ad0aecdbebe60744d3d88))
* ui шаблонов распределений: карточки, добавление, редактирование, удаление ([6efebc0](https://github.com/AlexeyPahomov/coffer/commit/6efebc03e7b8aac6eb7ddeafead2e7c3823cc9a8))


### Bug Fixes

* карточки шаблонов ([c64e6cf](https://github.com/AlexeyPahomov/coffer/commit/c64e6cf4b6d6c9d8a4056f34528b5ab08e35f194))
* карусель месяцов ([2c7dcda](https://github.com/AlexeyPahomov/coffer/commit/2c7dcda08fe2ea627c0dc0c99d6bd3c6ac399977))
* расчёт остатков ([a945e8c](https://github.com/AlexeyPahomov/coffer/commit/a945e8c8c34b99af791d02555bab43c9a11e051e))
* скролл ([84ef0ec](https://github.com/AlexeyPahomov/coffer/commit/84ef0ec5641c099d17fc94c36516812f699ca7d7))
* стабильность соединения с бд ([fb40bad](https://github.com/AlexeyPahomov/coffer/commit/fb40bad47c682e2e72e7c2836a425f79100ea0fe))
* ui планирования ([3a9bb08](https://github.com/AlexeyPahomov/coffer/commit/3a9bb0880d8857b0eb4fda08d28b50a3840466cd))

## 1.1.0 (2026-05-29)


### Features

* :art: иконка приложения ([4a7e0f2](https://github.com/AlexeyPahomov/coffer/commit/4a7e0f290c26087cfa64cd9adf8b7e9b77eec35e))
* базовые ui компоненты ([c2669ef](https://github.com/AlexeyPahomov/coffer/commit/c2669ef266878304bfa2103c9d8c083450ec3dd8))
* верхний бюджет ([5a05dfa](https://github.com/AlexeyPahomov/coffer/commit/5a05dfa4a58adf57f4401eb8b6edef61d3b65c4b))
* движок расчёта ([ad30f29](https://github.com/AlexeyPahomov/coffer/commit/ad30f29c9097dd9c82a741bad8e6ec09a4cce247))
* добавить БД ([be967a0](https://github.com/AlexeyPahomov/coffer/commit/be967a0a7eb36ffe9d5d9c6444a1779cb8068746))
* добавить месячный расчёт ([cf5089c](https://github.com/AlexeyPahomov/coffer/commit/cf5089c30dd8ec641f41967db6c8a4287c04884a))
* добавление дохода, список доходов и заглушки остальных страниц ([a186beb](https://github.com/AlexeyPahomov/coffer/commit/a186beb739bf716844211790948a7a11e357473b))
* добавление категорий ([67cb0c4](https://github.com/AlexeyPahomov/coffer/commit/67cb0c41523c064918b308067852a20e10b5249b))
* добавление категорий ([a901bea](https://github.com/AlexeyPahomov/coffer/commit/a901bead7ccca44ddb95505dfb8c4c1889694db3))
* добавление расхода при перерасходе ([755207d](https://github.com/AlexeyPahomov/coffer/commit/755207d619352ee1c936aff42049315ae8e6cde0))
* иконки карточек ([f979de3](https://github.com/AlexeyPahomov/coffer/commit/f979de3bd7ea41896cfc756277b9d9b722765cc8))
* иконки категорий, правки ui ([8cb758e](https://github.com/AlexeyPahomov/coffer/commit/8cb758ec0e8abed192c5a86ab56857b43e9cb3f8))
* интервал дат для планов ([e7c9138](https://github.com/AlexeyPahomov/coffer/commit/e7c91385407584c389e75a50c6d2571757bf2b0a))
* история расходов ([a75330d](https://github.com/AlexeyPahomov/coffer/commit/a75330deec642a55bb014b526637d6ccd3b6216f))
* карточки историй в строку ([20e3457](https://github.com/AlexeyPahomov/coffer/commit/20e3457bc8aed2103152fdf19f14c60c9725358a))
* карточки расходов ([0b373fc](https://github.com/AlexeyPahomov/coffer/commit/0b373fcd5bf77f4b8059ef18591d56e337c59a97))
* карусель месяцов планирования ([ec374a5](https://github.com/AlexeyPahomov/coffer/commit/ec374a56babe6120fcb7b4cb4795eea21f7fa371))
* компонент бейдж ([7e43200](https://github.com/AlexeyPahomov/coffer/commit/7e4320095c598db52312be00fcbe2d1776667721))
* лоадер на кнопку ([d3b1615](https://github.com/AlexeyPahomov/coffer/commit/d3b161500f53567fe951792c496d7a0a7a6c6ad0))
* мобильный адаптив планирования ([9bf304d](https://github.com/AlexeyPahomov/coffer/commit/9bf304d460d387ebadfe9ad7d7fc015b2605d6d1))
* мобильный адаптив страницы категорий ([03476a3](https://github.com/AlexeyPahomov/coffer/commit/03476a3458e92f7bd515bfe751720999102a8136))
* мобильный сайдбар ([933d07d](https://github.com/AlexeyPahomov/coffer/commit/933d07d9039e89cba0fc0056a3e2bc62e66398f3))
* модалка и форма расходов ([e858ba6](https://github.com/AlexeyPahomov/coffer/commit/e858ba6caa877101a6f5f6e1e0e15ade47537348))
* накопления в свой блок ([4551574](https://github.com/AlexeyPahomov/coffer/commit/4551574f528afc6d414a3c336ec399dedb41908f))
* новый визуал карточек для мобилки ([9e06a63](https://github.com/AlexeyPahomov/coffer/commit/9e06a63efd0b3356056ec7a921d48d1e092a7107))
* новый сайдбар ([0c5f9b2](https://github.com/AlexeyPahomov/coffer/commit/0c5f9b2cd201fe841274098b9af83b2975b0d6d2))
* обновить календарь ([f8c2bfd](https://github.com/AlexeyPahomov/coffer/commit/f8c2bfd3e2b12d00c0a29f94b919eea432e62644))
* обновить ui расходов ([8ddf0d5](https://github.com/AlexeyPahomov/coffer/commit/8ddf0d57e8915642aac68c61568e96a3b348d107))
* обновление экрана расходов ([9c78031](https://github.com/AlexeyPahomov/coffer/commit/9c78031cb46ab5c6ff202c04752bb20e31b88b9c))
* обновление ux распределений ([5b394d1](https://github.com/AlexeyPahomov/coffer/commit/5b394d17eb5869642d385a41712a5dd5822ebf26))
* общие api, хелперы конфиги ([316568b](https://github.com/AlexeyPahomov/coffer/commit/316568b1a9930bd1ce8e155bcb87f46867832934))
* общий конфиг приложения ([f7f088d](https://github.com/AlexeyPahomov/coffer/commit/f7f088d5f298b6f54e64cf6d78029a93acc959a4))
* перерасходы, накопления, ui ([de26ec7](https://github.com/AlexeyPahomov/coffer/commit/de26ec7f19456ed32c62bd815be72186dda995a4))
* пикер месяцов ([6dbefd7](https://github.com/AlexeyPahomov/coffer/commit/6dbefd7a4c11d3de7f8a6856f870b723c2edd4d4))
* плавность при переключении контента на страницах ([f493225](https://github.com/AlexeyPahomov/coffer/commit/f493225fab1f22a08b60db3b7837cf392f052c23))
* плавные анимации изменений размеров списка категорий ([6bdf39a](https://github.com/AlexeyPahomov/coffer/commit/6bdf39a5b392aeb590f03c236f949f0db4b4472f))
* плавные переходы страниц ([ce2f055](https://github.com/AlexeyPahomov/coffer/commit/ce2f055bb2deacd3da6a404087368a57e1adca9e))
* планирование расходов ([ed5e48b](https://github.com/AlexeyPahomov/coffer/commit/ed5e48b2a8c1c9cbacbca8c2ca306163d87d2f9f))
* положения блоков при скролле ([7ea5724](https://github.com/AlexeyPahomov/coffer/commit/7ea5724ffb3929299008c44819deecfd77f53a6f))
* работа с месяцами - открытие, закрыти, таблицы ([3c7a8cf](https://github.com/AlexeyPahomov/coffer/commit/3c7a8cf8d4957096eb2f95400c24e2960ad6f7c1))
* распределения ([df34255](https://github.com/AlexeyPahomov/coffer/commit/df34255dca77478704c2dcee25a85fc617f30046))
* расходы ui ([b969fb0](https://github.com/AlexeyPahomov/coffer/commit/b969fb060ade78b1635ce407b5fc2e67ec8249fe))
* редактирование карточек категорий на мобилке ([9a803ca](https://github.com/AlexeyPahomov/coffer/commit/9a803ca98e6864552b01170df50ef9bdc7ae4ca1))
* редизайн доходов ([eb2f3b4](https://github.com/AlexeyPahomov/coffer/commit/eb2f3b41ed409a11217a84f47f6199d262bf9170))
* редизайн страницы категорий ([80b466d](https://github.com/AlexeyPahomov/coffer/commit/80b466d064748f91e35e3dbf391020ece7dc92d3))
* сайдбар ([7a876aa](https://github.com/AlexeyPahomov/coffer/commit/7a876aa5d516f52d13dde3954ccf7e6760803cca))
* страница расходов ([ef565ed](https://github.com/AlexeyPahomov/coffer/commit/ef565ed2fe887b1dad1cffd12a4da454b712558c))
* удаление дохода ([d5bf346](https://github.com/AlexeyPahomov/coffer/commit/d5bf3461e28cac8befcae951eee82a70728f7e63))
* фаб кнопка ([b05aaf0](https://github.com/AlexeyPahomov/coffer/commit/b05aaf091fb57aee8e090c56f983da340df24121))
* фильтр истории по клику на карточку ([436c0d9](https://github.com/AlexeyPahomov/coffer/commit/436c0d90ebde26f4ad10ba3fca6611e54bb4ad23))
* цвет карточкам ([be9374d](https://github.com/AlexeyPahomov/coffer/commit/be9374d00858d535591003532335c1894e5ccb05))
* цвета блока зарезервировано ([766ae86](https://github.com/AlexeyPahomov/coffer/commit/766ae86a0702969ce8224dde7308d4c71d284b7c))
* add npm workspaces ([cbe4544](https://github.com/AlexeyPahomov/coffer/commit/cbe45442cb0f30ad2b238b784c3881f308a7d7eb))
* add shadcn ([5cfe661](https://github.com/AlexeyPahomov/coffer/commit/5cfe6616792e35d8c51adcf1a8f705812db32ddb))
* allocation module ([236c501](https://github.com/AlexeyPahomov/coffer/commit/236c501f90f376c7a4b57ad7020974fd11c822b7))
* category module ([7924d24](https://github.com/AlexeyPahomov/coffer/commit/7924d24e2c7389ba96ac90dd75cb02ef08c60eb0))
* expense module ([9ba4198](https://github.com/AlexeyPahomov/coffer/commit/9ba41987f2d67ebe13cc217adf613de9bfdd6b52))
* income module ([c84225b](https://github.com/AlexeyPahomov/coffer/commit/c84225ba2d5d79f6a5a368c65b7c5ed07b5feb21))
* income ui + api ([4ffc357](https://github.com/AlexeyPahomov/coffer/commit/4ffc357c9e1fc53c7cfd925e5867a20816555a90))
* input & ui refactor ([ad4f74f](https://github.com/AlexeyPahomov/coffer/commit/ad4f74fe383261f3c5c25eef8a062f3f1ec75318))
* kpi карточки ([a9586ce](https://github.com/AlexeyPahomov/coffer/commit/a9586ce2f0411e65d48e9e982ad3f7650c066529))
* money view ([0f4362a](https://github.com/AlexeyPahomov/coffer/commit/0f4362a42ca50b5613cac2052799298c7f77db1a))
* ui карточек расходов ([671f390](https://github.com/AlexeyPahomov/coffer/commit/671f390874dcbdc5301ea72ab9d729d85d829cb8))
* ui перерасхода бюджета ([644668f](https://github.com/AlexeyPahomov/coffer/commit/644668f13813a7c1e3a2efed85301a5124666916))
* ui приложения ([092d312](https://github.com/AlexeyPahomov/coffer/commit/092d312f8bf3c77831600a692e5d484931033ab9))
* ui списков ([e61775b](https://github.com/AlexeyPahomov/coffer/commit/e61775b3a3bf17066cf122a42555c2faaaccc064))
* ui/ux экрана распределений ([0112ac4](https://github.com/AlexeyPahomov/coffer/commit/0112ac40a20956ae116d65c6d6a03c0a8aa226bc))


### Bug Fixes

* билд ([112548f](https://github.com/AlexeyPahomov/coffer/commit/112548f19f6412ce226b3ac63e6c487ccc918c11))
* выравнивание в карточке истории для мобилки ([7c74ddb](https://github.com/AlexeyPahomov/coffer/commit/7c74ddb8e5e2a7d44b5b295de281e8d91e4c3a76))
* двойные скроллы на safari ([1043e9d](https://github.com/AlexeyPahomov/coffer/commit/1043e9d2ce878ef3efbe22336619d7837676ab1d))
* дёргание фаба ([57ca838](https://github.com/AlexeyPahomov/coffer/commit/57ca838810ddb8a44eaa74cf39055f6710af6950))
* лейблы категорий ([2c49d16](https://github.com/AlexeyPahomov/coffer/commit/2c49d167770d923e4e0a876a7aa1eb4cec93ace7))
* ошибки при переключении статусов/редактировании карточки плана ([477156e](https://github.com/AlexeyPahomov/coffer/commit/477156e5016956005d5ec3e4e9f71275f11a29da))
* поправить работу с остатками и расходами ([e6d68a1](https://github.com/AlexeyPahomov/coffer/commit/e6d68a1e14b86fc4d59aa2f7146c1feba22a3158))
* разобраться с анимациями элементов ([98b5a13](https://github.com/AlexeyPahomov/coffer/commit/98b5a1399ddb4b060564ec9866898a46d8b98f72))
* расчёт остатка по категории при редактировании расхода ([c431c87](https://github.com/AlexeyPahomov/coffer/commit/c431c877316882633c191e2d18134fa7a3523206))
* расчёт по категориям ([7347b94](https://github.com/AlexeyPahomov/coffer/commit/7347b943686b556f213ef16cf8c03019ef0f97e1))
* скрыть блок планировани на расходах ([696cc80](https://github.com/AlexeyPahomov/coffer/commit/696cc80157d9cd18c44924a5881c1a4fedea2ea6))
* фон пикера ([5fdb944](https://github.com/AlexeyPahomov/coffer/commit/5fdb944c8b6d180ac6e23e7d876e58e01a7f36d2))
* add server folder ([f8dfadd](https://github.com/AlexeyPahomov/coffer/commit/f8dfadd102d380755f63ebbb3393098214219017))
* build ([fd1fcf3](https://github.com/AlexeyPahomov/coffer/commit/fd1fcf36aa5962005f877ac93a500180457e2b94))
* ts ([f121e80](https://github.com/AlexeyPahomov/coffer/commit/f121e80b9deaede4ae7b088cdd37704f677985e9))

# Changelog

All notable changes to this project will be documented in this file.
See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
