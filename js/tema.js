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
