const fs = require('fs');
let content = fs.readFileSync('eshot.html', 'utf8');
content = content.replace('</div> <!-- End of dashboard-grid -->', 
`</div> <!-- End of dashboard-grid -->

            <!-- Tüm Hatlar Kapsama Alanı / Çapı -->
            <div class="card full-width" style="margin-top: 2rem; margin-bottom: 2rem;">
                <h2><i class="fa-solid fa-map-location-dot" style="color: var(--accent-1);"></i> ESHOT Güzelbahçe Geneli Tüm Hatların Etki Çapı ve Kapsama Alanı</h2>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Aşağıdaki görselde, ESHOT otobüs ağının Güzelbahçe genelindeki hizmet yarıçapı, kapsama alanı ve tüm güzergahların oluşturduğu bütünleşik etki çapı detaylı olarak haritalandırılmıştır.</p>
                <div style="padding: 0; text-align: center; background: rgba(15, 23, 42, 0.8); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1);">
                    <div class="interactive-image-container" onclick="openImageModal('tüm.jpeg')" style="width: 100%; display: block; border-radius: 0;">
                        <img src="tüm.jpeg" alt="Tüm Hatların Etki Çapı" style="width: 100%; height: auto; display: block; image-rendering: high-quality; border-radius: 0;">
                        <div class="image-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i> Büyüt</div>
                    </div>
                </div>
            </div>`);
fs.writeFileSync('eshot.html', content, 'utf8');
console.log('Inserted section into eshot.html');
