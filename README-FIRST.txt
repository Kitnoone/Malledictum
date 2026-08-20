ГОТОВАЯ СТАТИЧЕСКАЯ СБОРКА ДЛЯ GITHUB PAGES

1. Распакуйте ZIP-архив на компьютере.
2. Откройте репозиторий Kitnoone/Malledictum на GitHub.
3. Нажмите Add file -> Upload files.
4. Перетащите ВЕСЬ КОНТЕНТ из распакованной папки, а не саму папку целиком.
   Файл index.html должен оказаться прямо в корне репозитория.
5. Разрешите GitHub заменить существующий index.html и сохраните изменения
   кнопкой Commit changes.
6. Откройте Settings -> Pages.
7. В разделе Build and deployment выберите:
   Source: Deploy from a branch
   Branch: main
   Folder: /(root)
8. Нажмите Save и подождите 1-3 минуты.
9. Откройте https://kitnoone.github.io/Malledictum/ и нажмите Ctrl+F5.

Папки src и dist, а также прочие исходники можно пока не удалять: готовый
index.html будет использовать только файлы из папки assets и статические
изображения, находящиеся в корне.
