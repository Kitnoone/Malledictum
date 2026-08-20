МОБИЛЬНАЯ СБОРКА IMPERIUM DATASLATE ДЛЯ GITHUB PAGES

Эта версия уже собрана. Node.js и GitHub Actions не требуются.

1. Распакуйте ZIP-архив на компьютере.
2. Откройте репозиторий Kitnoone/Malledictum на GitHub.
3. Нажмите Add file -> Upload files.
4. Перетащите ВСЕ файлы и папку assets из распакованного архива.
   index.html должен находиться прямо в корне репозитория.
5. Подтвердите замену прежнего index.html и нажмите Commit changes.
6. В Settings -> Pages оставьте:
   Source: Deploy from a branch
   Branch: main
   Folder: /(root)
7. Подождите 1-3 минуты и откройте:
   https://kitnoone.github.io/Malledictum/
8. Если видна старая версия, обновите страницу через Ctrl+F5.

Мобильный интерфейс включается автоматически на узких экранах. В нём есть
верхняя панель состояния, нижняя навигация, крупные поля для iOS и Android,
безопасные отступы вокруг выреза экрана и домашнего индикатора.
