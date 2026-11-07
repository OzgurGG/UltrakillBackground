# ULTRAKILL Dynamic Desktop Wallpaper (V1 CRT Visualizer)

Windows masaüstü için hafif (~%1 CPU/GPU), taşınabilir ve otantik **ULTRAKILL** temalı dinamik CRT duvar kâğıdı. 

Three.js ve React tabanlı WebGL CRT filtrelerini C# WinForms WebView2 kabuğunda doğrudan Windows masaüstü simgelerinin arkasında çalıştırır.

---

## Özellikler

* **Otantik Hermetik C & AST Prosedürel Kod Motoru:** Hakita'nın ULTRAKILL başlık ekranındaki simyasal kod gramerini temel alır. 5 farklı şablon ve devasa sözlük havuzuyla saatlerce ve günlerce asla tekrarlanmayan, merdiven biçimli tab girintilerine sahip C AST kod blokları üretir.
* **Vitruvian V1 ve Dinamik CRT Filtresi:** Donanım hızlandırmalı fosfor parıltısı, scanline çizgileri ve ayarlanabilir ekran bükümü (curvature).
* **Ultra Düşük Kaynak Tüketimi:** 30 FPS kare sınırlama ve optimize edilmiş kompozit katmanlar sayesinde arka planda çalışırken yalnızca **~%1 CPU ve GPU** kullanır.
* **Minimalist Ayar Menüsü:** Sistem tepsisindeki (Tray) V1 simgesine sağ tıklayarak renk paletini, daktilo hızını, CRT bükümünü ve operatör metinlerini canlı olarak özelleştirebilirsiniz.
* **Taşınabilir (Portable):** Kurulum gerektirmez; klasördeki `UltrakillBackground.exe` dosyasına çift tıklanarak çalıştırılır.

---

## Hızlı Başlangıç & İndirme

1. **[Releases](../../releases/latest)** sekmesinden en güncel `UltrakillBackground-vX.X.X.zip` dosyasını indirin.
2. Arşivi bir klasöre çıkartın.
3. Klasördeki **`Baslat.bat`** veya `UltrakillBackground.exe` dosyasını çalıştırın.
4. Ayarları değiştirmek için sağ alttaki sistem tepsisindeki (Tray) V1 simgesine sağ tıklayıp **Ayarlar (Settings)...** seçeneğini açın.

> **Önemli (Windows Güvenlik Uyarısı / Akıllı Uygulama Denetimi):**
> * **Akıllı Uygulama Denetimi (Smart App Control) Engellerse:** Doğrudan **`Baslat.bat`** dosyasını çalıştırın veya `UltrakillBackground.exe` dosyasına **Sağ Tık -> Özellikler (Properties)** açıp en alttaki **"Engellemeyi Kaldır" (Unblock)** kutucuğunu işaretleyin.
> * **SmartScreen Uyarısı Çıkarsa:** **"Ek bilgi" -> "Yine de çalıştır"** demeniz yeterlidir.

---

## Kaynak Koddan Derleme (Build from Source)

Projeyi kendi bilgisayarınızda derlemek için:

1. **Gereksinimler:**
   * Node.js (v18+)
   * .NET Framework 4.8 veya Windows SDK `csc.exe`

2. **Otomatik Derleme:**
   ```cmd
   build-release.bat
   ```
   Bu betik web arayüzünü derler, C# uygulamasını derler ve `ultrakillbackgroundapp` klasörüne hazır çalıştırılabilir paketi yerleştirir.

---

## Lisans

Bu proje kişisel eğlence ve ULTRAKILL hayran çalışması olarak hazırlanmıştır. ULTRAKILL ve ilgili tüm görseller Arsi "Hakita" Patala ve New Blood Interactive'e aittir.

