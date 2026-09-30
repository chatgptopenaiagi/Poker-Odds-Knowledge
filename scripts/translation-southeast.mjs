import {catalog} from './translation-build.mjs';
catalog('id','Main|Lab peluang|Latihan|Tinjauan tangan|Kemajuan|Pengaturan|Mulai tangan|Tangan berikutnya|Menyerah|Cek|Ikut|Pasang|Naikkan|Semua masuk|Pot|Tumpukan|Kartu bersama|Anda|Jeda|Lanjutkan|Satu langkah|Tampilkan hitungan|Sembunyikan jawaban|Praktik|Belajar|Jawab dahulu|Periksa jawaban|Latihan berikutnya|Putar ulang|Cadangkan kemajuan|Impor cadangan|Atur ulang kemajuan|Batal|Konfirmasi|Tampilan pemula|Tampilan lanjut|Bahasa|Kurangi gerakan|Hitungan benar|Baca penjelasan|Jawaban Anda|Langkah perhitungan|Ketepatan hitungan|Percobaan|Chip latihan|Menghitung…|Hentikan hitungan|Rentang lawan|Bobot|Kartu diketahui|Bagian pot yang diharapkan|Asumsi|Metode|Sampel|Mulai',`
Berapa kartu membentuk tangan Hold’em yang dinilai?
A♣ 2♦ 3♥ 4♠ 5♣: berapa peringkat tertinggi straight ini? As = 14.
Papan K♣ K♦ 7♥ 4♠ 2♣; kursi 1 A♥ Q♥, kursi 2 A♠ J♠. Kursi mana menang?
Papan A♠ K♠ Q♠ J♠ T♠, tiga pemain. Berapa persen pot untuk masing-masing sebelum chip yang tidak dapat dibagi?
Empat hati terlihat pada kartu Anda dan flop, tanpa kartu diketahui lainnya. Berapa kartu hati sasaran tersisa?
47 kartu tidak diketahui, 9 sasaran tetap: peluang persen mengenai sasaran pada kartu berikutnya?
47 kartu tidak diketahui, 9 sasaran tetap, melihat dua kartu tanpa keputusan lain: peluang persen minimal satu sasaran?
Pada turn ada 46 kartu tidak diketahui dan 9 sasaran. Peluang persen mengenai sasaran di river?
Berapa perkiraan persen menurut aturan empat untuk 9 outs di flop dan dua kartu mendatang?
Berapa kombinasi dua kartu tanpa urutan dari 52 kartu berbeda?
Berapa kombinasi konkret QQ tanpa penghalang kartu?
Berapa kombinasi AKs tanpa penghalang? s berarti lambang sama.
Berapa kombinasi AKo tanpa penghalang? o berarti lambang berbeda.
Anda memegang A♠ 7♦; as lain tidak diketahui. Berapa kombinasi AA tersisa?
Dua tangan lengkap dan tiga kartu flop diketahui, tanpa kartu mati lain diketahui. Berapa pasangan turn/river tanpa urutan?
Pot 60, lawan memasang 20: P = 80, tambahan untuk ikut C = 20. Satu pot, tanpa taruhan berikutnya: ekuitas impas dalam persen?
P = 80, C = 20, E = 25%, satu pot yang berhak dimenangkan, tanpa rake atau taruhan lanjutan. EV ikut dibanding menyerah sekarang?
P = 80, C = 20, E = 15%, tanpa taruhan lanjutan. EV ikut?
Gertakan murni: P0 = 100, B = 50, ekuitas nol jika diikuti, tanpa keputusan lanjutan. Persen menyerah untuk impas?
P0 = 100, B = 50, asumsi peluang menyerah F = 40%, ekuitas nol jika diikuti. EV gertakan?
100 hasil sama mungkin: 30 menang sendiri, 20 seri dua pemain, 50 kalah. Ekuitas dalam persen?
Sebelum blind, dua pemain memiliki 240 dan 90 chip. Berapa tumpukan efektif?
Dua pemain: kursi 1 tombol/small blind, kursi 2 big blind. Keduanya bisa bertindak. Siapa lebih dahulu preflop?
Model: P = 80, C = 20, peluang kena 10%. Jika kena selalu menang dan mendapat tambahan 100 dari lawan; jika meleset kalah tanpa pembayaran tambahan. EV ikut?
EV dasar +5 chip. Secara terpisah ada peluang 10% rugi tambahan 80 yang belum dihitung. EV baru?
Tiga pemain menyetor 30, 80, 80 chip. Pemain pertama all-in. Berapa pot utama yang bisa dimenangkan ketiganya?
Tanpa penghalang, rentang hanya AA berbobot 100% dan KK berbobot 50%. Berapa persen AA setelah normalisasi?
9 sasaran flush dan 8 sasaran straight; tepat 2 kartu termasuk keduanya. Berapa sasaran berbeda?
`, `
Lima terbaik dari tujuh dihitung. Boleh memakai nol, satu, atau dua kartu pribadi; bukan menilai tujuh sekaligus.
As berada di bawah dua di sini. Straight tidak boleh berputar melewati as.
Setelah K-K-A, kicker Q mengalahkan J. As yang sama tidak membuat hasil seri.
Semua memakai royal flush yang sama. Lambang atau kartu pribadi tidak memecahkan seri; chip ganjil mengikuti aturan meja.
Kartu sasaran tidak menjamin kemenangan. Lawan dapat membaik; papan berpasangan atau flush lebih tinggi dapat berpengaruh.
Penyebut memakai jumlah kartu yang saat ini tidak diketahui. Mengenai sasaran tidak otomatis berarti menang.
Kurangi peluang dua kali meleset dari satu. Menggandakan peluang satu kartu mengabaikan pengambilan kartu dan menghitung sebagian hasil dua kali.
Ini perkiraan yang dinyatakan jelas, berbeda dari nilai eksak. Sasaran tetap dan benar-benar melihat dua kartu adalah asumsi.
Urutan terbalik kartu yang sama bukan kombinasi baru. 169 sel adalah kelas, bukan kombinasi konkret.
Hitung kombinasi sebelum penghalang. s hanya lambang sama, o berbeda; tanpa akhiran mencakup keduanya.
Hapus hanya kartu diketahui, lalu normalisasi bobot. Kartu rahasia simulator bukan penghalang yang diketahui.
Pasangan tanpa urutan cukup untuk ekuitas showdown akhir; keputusan per tahap memerlukan urutan.
Satu pot, tanpa rake dan taruhan lanjutan. Pembayaran ikut masuk pot akhir; jangan kurangi setoran masa lalu lagi. Keberuntungan berikutnya tidak mengubah hitungan.
Frekuensi menyerah adalah asumsi, bukan sifat lawan yang terbukti. Gertakan murni positif hanya di atas ambang impas.
Seri dua pemain dihitung setengah pot. Frekuensi menang, seri, dan kalah berbeda dari ekuitas.
Hanya tumpukan tersedia yang lebih kecil dapat diperebutkan melawan satu lawan.
Tombol/small blind bertindak pertama preflop dan terakhir setelah flop. Posisi saja bukan strategi yang telah dipecahkan.
Pembayaran tambahan mensyaratkan kena dan menang. Lawan nyata mungkin tidak membayar; biaya Anda berikutnya dan outs kotor juga harus dihitung.
Kurangi perkiraan kerugian tambahan satu kali. Ekuitas mentah tidak meramalkan pembayaran masa depan yang diasumsikan ini.
Hanya pemain yang berhak dapat memenangkan setiap pot. Pot utama dan samping memerlukan ekuitas terpisah.
Bobot berlaku per kombinasi dan dibagi jumlah total. Bobot sel belum merupakan peluang akhirnya.
Kurangi irisan satu kali agar tidak menghitung ganda. Sasaran berbeda pun belum tentu outs kemenangan bersih.
`);
catalog('ms','Main|Makmal kebarangkalian|Latihan|Semakan tangan|Kemajuan|Tetapan|Mula tangan|Tangan seterusnya|Tarik diri|Semak|Ikut|Taruh|Naikkan|Semua masuk|Pot|Timbunan|Kad bersama|Anda|Jeda|Sambung|Satu langkah|Tunjuk pengiraan|Sembunyi jawapan|Praktis|Belajar|Jawab dahulu|Semak jawapan|Latihan seterusnya|Main semula|Sandarkan kemajuan|Import sandaran|Tetap semula kemajuan|Batal|Sahkan|Paparan pemula|Paparan lanjutan|Bahasa|Kurangkan gerakan|Pengiraan betul|Baca penjelasan|Jawapan anda|Langkah pengiraan|Ketepatan pengiraan|Percubaan|Cip latihan|Mengira…|Hentikan pengiraan|Julat lawan|Pemberat|Kad diketahui|Bahagian pot dijangka|Andaian|Kaedah|Sampel|Mula',`
Berapa kad membentuk tangan Hold’em yang dinilai?
A♣ 2♦ 3♥ 4♠ 5♣: apakah pangkat tertinggi straight ini? As = 14.
Papan K♣ K♦ 7♥ 4♠ 2♣; tempat 1 A♥ Q♥, tempat 2 A♠ J♠. Tempat mana menang?
Papan A♠ K♠ Q♠ J♠ T♠, tiga pemain. Berapa peratus pot untuk setiap pemain sebelum cip tidak boleh dibahagi?
Empat hati kelihatan pada kad anda dan flop, tiada kad lain diketahui. Berapa kad hati sasaran tinggal?
47 kad tidak diketahui, 9 sasaran tetap: kebarangkalian peratus mencapai sasaran pada kad seterusnya?
47 kad tidak diketahui, 9 sasaran tetap, dua kad tanpa keputusan lanjut: peluang peratus sekurang-kurangnya satu sasaran?
Pada turn ada 46 kad tidak diketahui dan 9 sasaran. Peluang peratus mencapai sasaran pada river?
Berapa peratus anggaran menurut peraturan empat dengan 9 outs pada flop dan dua kad akan datang?
Berapa gabungan dua kad tanpa susunan daripada 52 kad berbeza?
Berapa gabungan konkrit QQ tanpa penghalang?
Berapa gabungan AKs tanpa penghalang? s bermaksud bunga sama.
Berapa gabungan AKo tanpa penghalang? o bermaksud bunga berlainan.
Anda mempunyai A♠ 7♦, tiada as lain diketahui. Berapa gabungan AA tinggal?
Dua tangan penuh dan tiga kad flop diketahui, tiada kad mati lain. Berapa pasangan turn/river tanpa susunan?
Pot 60, taruhan lawan 20: P = 80, tambahan ikut C = 20. Satu pot, tiada taruhan lanjut: ekuiti pulang modal dalam peratus?
P = 80, C = 20, E = 25%, satu pot layak, tiada rake atau taruhan lanjut. EV ikut berbanding menarik diri sekarang?
P = 80, C = 20, E = 15%, tiada taruhan lanjut. EV ikut?
Gertakan tulen: P0 = 100, B = 50, ekuiti sifar jika diikuti, tiada keputusan lanjut. Peratus tarik diri untuk pulang modal?
P0 = 100, B = 50, andaian peluang tarik diri F = 40%, ekuiti sifar jika diikuti. EV gertakan?
100 hasil sama mungkin: 30 kemenangan tunggal, 20 seri dua pemain, 50 kalah. Ekuiti dalam peratus?
Sebelum blind, dua pemain mempunyai 240 dan 90 cip. Apakah timbunan berkesan?
Dua pemain: tempat 1 butang/small blind, tempat 2 big blind. Kedua-duanya boleh bertindak. Siapa dahulu preflop?
Model: P = 80, C = 20, peluang kena 10%. Jika kena sentiasa menang dan menerima 100 tambahan daripada lawan; jika terlepas kalah tanpa bayaran lanjut. EV ikut?
EV asas +5 cip. Secara berasingan terdapat 10% peluang rugi tambahan 80 yang belum dikira. EV baharu?
Tiga pemain menyumbang 30, 80, 80 cip. Pemain pertama all-in. Berapa pot utama yang layak dimenangi ketiga-tiganya?
Tanpa penghalang, julat hanya AA dengan pemberat 100% dan KK dengan 50%. Peratus AA selepas penormalan?
9 sasaran flush dan 8 sasaran straight; tepat 2 kad dalam kedua-duanya. Berapa sasaran berbeza?
`, `
Lima terbaik daripada tujuh dikira. Boleh menggunakan sifar, satu atau dua kad sendiri; tujuh tidak dinilai sebagai satu tangan.
As berada di bawah dua di sini. Straight tidak boleh berpusing merentasi as.
Selepas K-K-A, kicker Q mengatasi J. As bersama tidak mewujudkan seri.
Semua menggunakan royal flush sama. Bunga atau kad sendiri tidak memecahkan seri; cip ganjil mengikut peraturan meja.
Kad sasaran tidak menjamin kemenangan. Lawan juga boleh meningkat; papan berpasangan atau flush lebih tinggi boleh penting.
Penyebut ialah bilangan kad yang kini tidak diketahui. Mencapai sasaran tidak semestinya menang.
Tolak kebarangkalian terlepas dua kali daripada satu. Menggandakan peluang tunggal mengabaikan pengeluaran kad dan mengira sesetengah hasil dua kali.
Ini anggaran yang dilabel jelas, berbeza daripada nilai tepat. Sasaran tetap dan benar-benar melihat dua kad diandaikan.
Susunan terbalik dua kad sama bukan gabungan baharu. 169 petak ialah kelas, bukan gabungan konkrit.
Kira gabungan sebelum penghalang. s merangkumi bunga sama, o berlainan; tanpa akhiran kedua-duanya disertakan.
Buang hanya kad diketahui lalu normalkan pemberat. Kad rahsia simulator bukan penghalang yang diketahui.
Pasangan tanpa susunan mencukupi untuk ekuiti akhir; keputusan setiap pusingan memerlukan susunan.
Satu pot, tiada rake atau taruhan lanjut. Bayaran ikut termasuk dalam pot akhir; jangan tolak sumbangan lampau lagi. Nasib kemudian tidak mengubah pengiraan.
Kekerapan tarik diri ialah andaian, bukan sifat lawan yang dibuktikan. Gertakan tulen positif hanya melebihi ambang.
Seri dua pemain dikira setengah pot. Kekerapan menang, seri dan kalah berbeza daripada ekuiti.
Hanya timbunan tersedia yang lebih kecil boleh dipertandingkan melawan seorang lawan.
Butang/small blind bertindak dahulu preflop dan terakhir selepas flop. Kedudukan sahaja bukan strategi yang diselesaikan.
Bayaran tambahan memerlukan sasaran dicapai dan kemenangan. Lawan sebenar mungkin tidak membayar; kos sendiri akan datang dan outs kotor perlu dikira.
Tolak jangkaan kerugian tambahan sekali sahaja. Ekuiti mentah tidak meramal bayaran masa hadapan yang diandaikan ini.
Hanya pemain layak boleh memenangi setiap pot. Pot utama dan sampingan memerlukan ekuiti berasingan.
Pemberat terpakai bagi setiap gabungan dan dibahagi jumlah keseluruhan. Pemberat petak belum menjadi kebarangkalian akhir.
Tolak persilangan sekali untuk mengelakkan kiraan berganda. Sasaran berbeza belum tentu outs kemenangan bersih.
`);
catalog('vi','Chơi|Phòng xác suất|Bài tập|Xem lại ván|Tiến độ|Cài đặt|Bắt đầu ván|Ván tiếp theo|Bỏ bài|Nhường|Theo|Cược|Tố|Tất tay|Pot|Chồng chip|Bài chung|Bạn|Tạm dừng|Tiếp tục|Một bước|Xem phép tính|Ẩn đáp án|Thực hành|Học|Trả lời trước|Kiểm tra đáp án|Bài tiếp theo|Phát lại|Sao lưu tiến độ|Nhập bản sao lưu|Đặt lại tiến độ|Hủy|Xác nhận|Giao diện cơ bản|Giao diện nâng cao|Ngôn ngữ|Giảm chuyển động|Tính đúng|Xem giải thích|Câu trả lời của bạn|Các bước tính|Độ chính xác tính toán|Lượt thử|Chip luyện tập|Đang tính…|Dừng tính|Phạm vi đối thủ|Trọng số|Bài đã biết|Phần pot kỳ vọng|Giả định|Phương pháp|Số mẫu|Bắt đầu',`
Tay bài được xếp hạng trong Hold’em gồm mấy lá?
A♣ 2♦ 3♥ 4♠ 5♣: hạng cao nhất của sảnh này là bao nhiêu? A = 14.
Bài chung K♣ K♦ 7♥ 4♠ 2♣; ghế 1 A♥ Q♥, ghế 2 A♠ J♠. Ghế nào thắng?
Bài chung A♠ K♠ Q♠ J♠ T♠, ba người ngửa bài. Mỗi người được bao nhiêu phần trăm pot trước khi chia chip lẻ?
Có bốn lá cơ trong bài bạn và flop, không biết lá khác. Còn bao nhiêu lá cơ mục tiêu?
47 lá chưa biết, 9 mục tiêu cố định: xác suất phần trăm trúng ở lá tiếp theo?
47 lá chưa biết, 9 mục tiêu cố định, xem hai lá không có quyết định thêm: phần trăm có ít nhất một lần trúng?
Ở turn còn 46 lá chưa biết và 9 mục tiêu. Xác suất phần trăm trúng ở river?
Quy tắc nhân bốn cho 9 outs ở flop và hai lá sắp tới ước lượng bao nhiêu phần trăm?
Có bao nhiêu tổ hợp hai lá không phân biệt thứ tự từ 52 lá khác nhau?
Có bao nhiêu tổ hợp QQ cụ thể khi chưa có lá chặn?
Có bao nhiêu tổ hợp AKs khi chưa có lá chặn? s là đồng chất.
Có bao nhiêu tổ hợp AKo khi chưa có lá chặn? o là khác chất.
Bạn có A♠ 7♦, không biết át nào khác. Còn bao nhiêu tổ hợp AA?
Biết hai tay bài đầy đủ và ba lá flop, không có lá chết nào khác đã biết. Có bao nhiêu cặp turn/river không phân biệt thứ tự?
Pot 60, đối thủ cược 20: P = 80, theo thêm C = 20. Một pot, không cược tiếp: equity hòa vốn là bao nhiêu phần trăm?
P = 80, C = 20, E = 25%, một pot đủ điều kiện, không phí hay cược tiếp. EV theo so với bỏ ngay?
P = 80, C = 20, E = 15%, không cược tiếp. EV theo?
Bluff thuần: P0 = 100, B = 50, equity bằng 0 nếu bị theo, không quyết định tiếp. Tỷ lệ bỏ bài hòa vốn là bao nhiêu phần trăm?
P0 = 100, B = 50, giả định tỷ lệ bỏ F = 40%, equity bằng 0 nếu bị theo. EV bluff?
100 kết quả đồng xác suất: 30 thắng riêng, 20 hòa hai người, 50 thua. Equity phần trăm?
Trước blind, hai người có 240 và 90 chip. Stack hiệu dụng là bao nhiêu?
Hai người: ghế 1 nút/small blind, ghế 2 big blind. Cả hai có thể hành động. Ai đi trước preflop?
Mô hình: P = 80, C = 20, trúng 10%. Trúng thì luôn thắng và nhận thêm 100 từ đối thủ; trượt thì thua không trả thêm. EV theo?
EV cơ bản +5 chip. Riêng có 10% mất thêm 80 chưa tính vào. EV mới?
Ba người góp 30, 80, 80 chip. Người đầu tất tay. Pot chính mà cả ba có quyền thắng là bao nhiêu?
Không có lá chặn, phạm vi chỉ có AA trọng số 100% và KK 50%. Xác suất AA chuẩn hóa là bao nhiêu phần trăm?
9 mục tiêu thùng, 8 mục tiêu sảnh; đúng 2 lá thuộc cả hai nhóm. Có bao nhiêu mục tiêu khác nhau?
`, `
Chọn năm lá tốt nhất trong bảy. Có thể dùng không, một hoặc hai lá riêng; không xếp hạng cả bảy như một tay.
Át nằm dưới hai trong sảnh này. Sảnh không được vòng qua át.
Sau K-K-A, kicker Q thắng J. Cùng át không có nghĩa hòa.
Mọi người dùng cùng sảnh đồng chất cao nhất. Chất và bài riêng không phá hòa; chip lẻ theo quy tắc bàn.
Lá mục tiêu không bảo đảm thắng. Đối thủ cũng có thể mạnh lên; bài chung có đôi hoặc thùng cao hơn có thể ảnh hưởng.
Mẫu số là số lá chưa biết hiện tại. Trúng mục tiêu không tự động là thắng.
Lấy một trừ xác suất trượt cả hai lần. Nhân đôi xác suất một lá bỏ qua việc loại lá và đếm trùng kết quả.
Đây là ước lượng có nhãn rõ ràng, khác giá trị chính xác. Giả định mục tiêu cố định và thực sự xem hai lá.
Đảo thứ tự hai lá giống nhau không tạo tổ hợp mới. 169 ô là lớp bài, không phải tổ hợp cụ thể.
Đếm tổ hợp trước lá chặn. s chỉ đồng chất, o khác chất; không hậu tố bao gồm cả hai.
Chỉ loại lá đã biết rồi chuẩn hóa trọng số. Bài bí mật của mô phỏng không phải lá chặn đã biết.
Cặp không thứ tự đủ cho equity ngửa bài cuối cùng; quyết định từng vòng cần thứ tự.
Một pot, không phí hay cược tiếp. Lần theo này vào pot cuối; không trừ lại phần đã góp. May mắn sau đó không đổi phép tính.
Tần suất bỏ là giả định, không phải đặc điểm đối thủ đã chứng minh. Bluff thuần chỉ dương khi vượt ngưỡng.
Hòa hai người tính nửa pot. Tần suất thắng, hòa và thua khác equity.
Chỉ stack nhỏ hơn hiện có được tranh với một đối thủ.
Nút/small blind đi trước preflop và sau cùng sau flop. Vị trí không tự cung cấp chiến lược đã giải.
Khoản thêm đòi hỏi trúng và thắng. Đối thủ thật có thể không trả; cần tính chi phí tương lai của bạn và outs không sạch.
Trừ tổn thất thêm kỳ vọng đúng một lần. Equity thô không dự đoán khoản trả tương lai giả định này.
Chỉ người đủ điều kiện được thắng mỗi pot. Pot chính và pot phụ cần equity riêng.
Trọng số áp dụng cho từng tổ hợp rồi chia tổng. Trọng số một ô chưa phải xác suất cuối.
Trừ giao một lần để tránh đếm trùng. Mục tiêu khác nhau vẫn chưa chắc là outs thắng sạch.
`);
