// =============================================
// Tema seçimi: sayfa çizilmeden önce kayıtlı temayı uygular (head içinde yüklenir)
// Varsayılan koyu temadır; açık tema <html data-tema="acik"> ile açılır.
// =============================================
(function () {
    try {
        if (localStorage.getItem('bas-tema') === 'acik') {
            document.documentElement.setAttribute('data-tema', 'acik');
        }
    } catch (e) { /* tarayıcı depolaması kapalıysa koyu tema kalır */ }
})();

// Hareket: kaydırınca beliren öğeler ve sayaçlar (uygulayan js/ui.js).
// Sınıf, sayfa çizilmeden eklenir ki içerik önce görünüp sonra gizlenmesin.
// "Hareketi azalt" tercihi varsa eklenmez; ui.js 4 sn içinde yüklenmezse geri alınır.
(function () {
    try {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var kok = document.documentElement;
        kok.classList.add('hareket');
        setTimeout(function () { if (!window.basHareketHazir) kok.classList.remove('hareket'); }, 4000);
    } catch (e) { /* hareketsiz devam */ }
})();
