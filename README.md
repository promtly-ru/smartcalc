# SmartCalc

Калькулятор с четырьмя режимами в одном окне: **базовый**, **программист** (HEX/DEC/OCT/BIN, битовые операции),
**финансы** (кредит, вклад, НДС, маржа) и **инженер** (длина, масса, температура). История вычислений,
светлая и тёмная тема.

## Скачать

| Платформа | Файл |
|---|---|
| Windows 10/11 | [SmartCalc-Setup.exe](https://github.com/workvibecoding398-sys/smartcalc/releases/latest/download/SmartCalc-Setup.exe) · [Portable](https://github.com/workvibecoding398-sys/smartcalc/releases/latest/download/SmartCalc-Portable.exe) |
| macOS (Apple Silicon) | [SmartCalc-mac-arm64.dmg](https://github.com/workvibecoding398-sys/smartcalc/releases/latest/download/SmartCalc-mac-arm64.dmg) |
| macOS (Intel) | [SmartCalc-mac-x64.dmg](https://github.com/workvibecoding398-sys/smartcalc/releases/latest/download/SmartCalc-mac-x64.dmg) |
| Android 7+ | [SmartCalc.apk](https://github.com/workvibecoding398-sys/smartcalc/releases/latest/download/SmartCalc.apk) |
| iPhone / iPad / любой браузер | [веб-версия](https://workvibecoding398-sys.github.io/smartcalc/) → «Поделиться» → «На экран Домой» |

Приложения не подписаны платными сертификатами Apple/Microsoft, поэтому при первом запуске система может предупредить:

- **Windows** — SmartScreen: «Подробнее» → «Выполнить в любом случае».
- **macOS** — откройте приложение, затем «Системные настройки» → «Конфиденциальность и безопасность» → «Всё равно открыть».
  Если macOS пишет, что приложение «повреждено»: `xattr -cr /Applications/SmartCalc.app` в Терминале.
- **Android** — разрешите установку из неизвестных источников для браузера или файлового менеджера.

## Разработка

```bash
npm install
npm run dev            # веб-версия на http://localhost:5173
npm run electron:dev   # десктоп (Electron) с горячей перезагрузкой
npm run icon           # пересобрать все иконки из build/*.svg
npm run android:sync   # собрать веб-часть и скопировать в android/
```

Стек: React 19, TypeScript, Vite, Tailwind CSS 4, Electron (Windows/macOS), Capacitor (Android), PWA (веб/iOS).

## Релиз

Поднимите версию в `package.json`, закоммитьте и отправьте тег:

```bash
git tag v1.2.0 && git push origin v1.2.0
```

GitHub Actions (`.github/workflows/release.yml`) соберёт Windows, macOS и Android и приложит файлы к релизу.
Веб-версия публикуется на GitHub Pages при каждом пуше в `main` (`.github/workflows/web.yml`).
