// =============================================
// Arayüz yardımcıları (tüm sayfalarda)
// 1) Küçük ekranlarda yan menüyü açıp kapatan "Menü" düğmesi
// 2) Tıklanabilir kutuların (harita, akordeon) klavyeyle de açılabilmesi
// =============================================

(function () {
    // ---- 1. Mobil menü ----
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.id = sidebar.id || 'yan-menu';

        const dugme = document.createElement('button');
        dugme.type = 'button';
        dugme.className = 'menu-toggle';
        dugme.setAttribute('aria-controls', sidebar.id);
        dugme.setAttribute('aria-expanded', 'false');
        dugme.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i><span>Menü</span>';
        document.body.prepend(dugme);

        const perde = document.createElement('div');
        perde.className = 'nav-backdrop';
        document.body.appendChild(perde);

        function menuyuAyarla(acik) {
            document.body.classList.toggle('nav-open', acik);
            dugme.setAttribute('aria-expanded', String(acik));
            dugme.querySelector('span').textContent = acik ? 'Kapat' : 'Menü';
            dugme.querySelector('i').className = acik ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        }

        dugme.addEventListener('click', function () {
            menuyuAyarla(!document.body.classList.contains('nav-open'));
        });
        perde.addEventListener('click', function () { menuyuAyarla(false); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
                menuyuAyarla(false);
                dugme.focus();
            }
        });
    }

    // ---- 2. Klavye erişimi ----
    // onclick ile çalışan div/span öğeleri Tab ile seçilebilir, Enter/Boşluk ile açılabilir olur
    document.querySelectorAll('[onclick]').forEach(function (el) {
        const etiket = el.tagName;
        if (etiket === 'BUTTON' || etiket === 'A' || etiket === 'INPUT') return;
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
        if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        if (el.classList.contains('accordion-header')) el.setAttribute('aria-expanded', 'false');
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    });
})();
