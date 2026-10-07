$word = New-Object -ComObject Word.Application
$word.Visible = $false
$htmlPath = Resolve-Path "Guzelbahce_Rapor.html"
$docxPath = Join-Path $PWD "Guzelbahce_Ulasim_Raporu_Final.docx"
$doc = $word.Documents.Open($htmlPath.Path)
$doc.SaveAs([ref]$docxPath, [ref]16)
$doc.Close()
$word.Quit()
