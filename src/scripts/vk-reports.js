const vkReports = [
    { element: 'vk_post_30291448_3597', post: 3597, hash: 'Thh21MP248datK9N0msxI-7xASc' },
    { element: 'vk_post_30291448_3581', post: 3581, hash: 'UIXQPvgGgGT97gV3XD857tW8_no' }
];

const vkApi = document.createElement('script');
vkApi.src = 'https://vk.ru/js/api/openapi.js';
vkApi.addEventListener('load', () => {
    const widgets = window.VK?.Widgets;
    if (!widgets) return;
    for (const report of vkReports) {
        const container = document.getElementById(report.element);
        widgets.Post(report.element, -30291448, report.post, report.hash, {
            width: container.clientWidth
        });
    }
});
document.head.append(vkApi);
