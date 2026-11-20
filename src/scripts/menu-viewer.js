const menuViewer = document.querySelector('.menu-viewer');
const menuViewerTitle = document.getElementById('menu-viewer-title');
const menuViewerPage = menuViewer.querySelector('.menu-viewer-page');
const menuViewerImage = menuViewerPage.querySelector('img');

document.querySelector('.menu-book').addEventListener('click', event => {
    const sheet = event.target.closest('.menu-sheet');
    if (!sheet || typeof menuViewer.showModal !== 'function' ||
        event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    menuViewerTitle.textContent = sheet.querySelector('strong').textContent;
    menuViewerImage.alt = 'Лист меню HHBAR — ' + menuViewerTitle.textContent;
    menuViewerImage.src = sheet.href;
    menuViewer.showModal();
    menuViewerPage.scrollTop = 0;
});
