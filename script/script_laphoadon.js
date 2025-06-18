document.addEventListener('DOMContentLoaded', function () {
    
    // Hiển thị tên nhân viên nếu đã đăng nhập
    const idNhanVien = localStorage.getItem('id_nhan_vien'); // hoặc sessionStorage

    if (idNhanVien) {
        fetch('http://localhost:3000/nhan_vien')
            .then(res => res.json())
            .then(nhanVienList => {
                const nv = nhanVienList.find(nv => nv.id === idNhanVien);
                if (nv) {
                    document.getElementById('staffName').textContent = nv.ho_ten;
                } else {
                    document.getElementById('staffName').textContent = '';
                }
            });
    } else {
        document.getElementById('staffName').textContent = '';
    }

    // Xử lý đăng xuất
    var logOutBtn = document.getElementById('logout');
    if (logOutBtn) {
        logOutBtn.addEventListener('click', function () {
            localStorage.removeItem('id_nhan_vien'); // <-- sửa lại key này
            window.location.href = "login.html";
        });
    }


    // Nuts Thêm hóa đơn mới
    var btnAdd = document.getElementById('btn_them');
    if (btnAdd) {
        btnAdd.addEventListener('click', function(event) {
            event.preventDefault();
            addHoaDon();
        });
    }
        // Thêm sự kiện tắt modal khi bấm nút Đóng
    var btnCloseModal = document.getElementById('btnCloseModal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', function() {
            $('#modalChiTietHoaDon').modal('hide');
        });
    }

    // Hiển thị danh sách hóa đơn
    start();
});


// Hàm fetch danh sách invoice_information
async function fetchInvoiceInfoList() {
    try {
        const response = await fetch('http://localhost:8081/invoice_information');
        return await response.json();
    } catch (error) {
        console.error('Error fetching invoice_information:', error);
        return [];
    }
}

// Hàm populate select từ invoice_information
function populateSelectPhieuDangKy(selectId, data) {
    const selectElement = document.getElementById(selectId);
    selectElement.innerHTML = '<option value="">-- Chọn phiếu --</option>';
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id; 
        option.textContent = item.idPdk; // tên phiếu đăng ký (idPdk)
        selectElement.appendChild(option);
    });
}

// Khởi tạo select khi trang load
async function initPhieuDangKySelect() {
    const list = await fetchInvoiceInfoList();
    populateSelectPhieuDangKy('id_phieu_dang_ky', list);
}
window.addEventListener('DOMContentLoaded', initPhieuDangKySelect);


document.getElementById('id_phieu_dang_ky').addEventListener('change', async function() {
    const id = this.value; 
    if (id) {
        const res = await fetch(`http://localhost:8081/invoice_information/${id}`);
        if (res.ok) {
            const info = await res.json();
            document.getElementById('ngay_tao').value = new Date().toISOString().slice(0, 10);
            document.getElementById('tong_tien').value = info.sumMoney || 0;
            document.getElementById('giam_gia').value = info.discount || 0;
        } else {
            document.getElementById('ngay_tao').value = '';
            document.getElementById('tong_tien').value = '';
            document.getElementById('giam_gia').value = '';
        }
    } else {
        document.getElementById('ngay_tao').value = '';
        document.getElementById('tong_tien').value = '';
        document.getElementById('giam_gia').value = '';
    }
});



// Hàm reset form
function resetForm() {
    document.getElementById('id_phieu_dang_ky').value = '';
    document.getElementById('ngay_tao').value = '';
    document.getElementById('tong_tien').value = '';
    document.getElementById('giam_gia').value = '';
    var radios = document.getElementsByName('phuong_thuc_tt');
    radios.forEach(r => r.checked = false);
}

const hoaDonAPI = "http://localhost:8081/invoice";


//------------------ CRUD -----------------------
// Lấy danh sách hóa đơn
function getHoaDon(callback) {
    fetch(hoaDonAPI, {
        method: 'GET',
        headers: { "Content-Type": "application/json" }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(callback)
    .catch(error => console.error('Error fetching hoa_don:', error));
}

// Tạo 
function createHoaDon(data, callback) {
    fetch(hoaDonAPI, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(callback)
    .catch(error => console.error('Error creating hoa_don:', error));
}


// Cập nhật hóa đơn
function updateHoaDon(id, data, callback) {
    fetch(`${hoaDonAPI}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(callback)
    .catch(error => console.error('Error updating hoa_don:', error));
}

// ------------------------- HÀM -----------------------

async function renderHoaDon(list_hoadon) {
    var tbody = document.querySelector('.table-responsive tbody');
    if (!tbody) {
        console.error('No tbody element found');
        return;
    }

    try {
        var htmls = list_hoadon.map(function(hoadon, index) {
            // Tính số tiền thanh toán
            const tongTien = Number(hoadon.total_amount) || 0;
            const giamGia = Number(hoadon.sales_amount) || 0;
            const thanhToan = tongTien - giamGia;

            return `
                <tr class="hoadon-item-${hoadon.id}">
                    <td>${index + 1}</td>
                    <td>${hoadon.id || ''}</td>
                    <td>${hoadon.registration_form_id || ''}</td>
                    <td>${hoadon.invoice_date || ''}</td>
                    <td>${hoadon.status || ''}</td>
                    <td>${tongTien.toLocaleString()}</td>
                    <td>${giamGia.toLocaleString()}</td>
                    <td>${thanhToan.toLocaleString()}</td>
                    <td>${hoadon.payment_method || ''}</td>
                    <td>
                        <button type="button" class="btn btn-warning btn-sm" onclick="editHoaDon('${hoadon.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = htmls;
    } catch (error) {
        console.error('Error rendering hoa_don:', error);
        tbody.innerHTML = '<tr><td colspan="10">Error loading data</td></tr>';
    }
}

// Thêm hóa đơn mới
async function addHoaDon() {
    var phieuDangKyInput = document.getElementById('id_phieu_dang_ky');
    var tongTienInput = document.getElementById('tong_tien');
    var giamGiaInput = document.getElementById('giam_gia');
    var phuongThucInput = document.querySelector('input[name="phuong_thuc_tt"]:checked');
    

    if (phieuDangKyInput && tongTienInput && phuongThucInput && giamGiaInput) {
        var id_phieu_dang_ky = phieuDangKyInput.value.trim();
        var tong_tien = tongTienInput.value.trim();
        var phuong_thuc_tt = phuongThucInput.value;
        var giam_gia = giamGiaInput.value.trim();

         // Lấy giá trị hiển thị (text) của option được chọn
        const selectedText = phieuDangKyInput.options[phieuDangKyInput.selectedIndex].text;

        if (id_phieu_dang_ky === "" || tong_tien === "" || phuong_thuc_tt === "" || giam_gia  === "") {
            alert("Vui lòng điền đầy đủ thông tin vào tất cả các ô.");
            return;
        }
        
        // Kiểm tra phiếu đăng ký đã lập hóa đơn chưa
        const resInvoice = await fetch('http://localhost:8081/invoice');
        const invoiceList = await resInvoice.json();
        const daCoHoaDon = invoiceList.some(invoice => invoice.registration_form_id === selectedText);
        if (daCoHoaDon) {
            alert("Phiếu đăng ký này đã được lập hóa đơn, không thể lập thêm!");
            resetForm();
            return;
        }



        
        var data = {
            registration_form_id: selectedText,
            invoice_date: new Date().toISOString().slice(0, 10),
            sales_amount: giam_gia,
            total_amount: String(tong_tien),
            status: "PAID",
            payment_method: phuong_thuc_tt 
        };
        createHoaDon( data, function() {
            getHoaDon(renderHoaDon);
            resetForm();
        });
    } else {
        alert("Không tìm thấy đủ các trường nhập liệu!");
    }
}


async function editHoaDon(id) {
    fetch(`http://localhost:8081/invoice/${id}`)
        .then(async function(response) {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(async function(hoaDon) {
            if (hoaDon) {
                document.getElementById('modalOverlayHoaDon').style.display = 'flex';

                // Load lại select phiếu đăng ký trước khi fill dữ liệu
                await initPhieuDangKySelect();

                // Fill dữ liệu vào các trường
                const selectPhieu = document.getElementById('modal_id_phieu_dang_ky');
                // Nếu option chưa có, thêm option tạm thời để không bị mất giá trị
                if (![...selectPhieu.options].some(opt => opt.value == hoaDon.registration_form_id)) {
                    const option = document.createElement('option');
                    option.value = hoaDon.registration_form_id;
                    option.textContent = hoaDon.registration_form_id;
                    selectPhieu.appendChild(option);
                }
                selectPhieu.value = hoaDon.registration_form_id || '';

                document.getElementById('modal_ngay_tao').value = hoaDon.invoice_date || '';
                document.getElementById('modal_tong_tien').value = hoaDon.total_amount || '';
                // Sửa dòng này để hiển thị đúng số tiền giảm
                document.getElementById('modal_giam_gia').value = hoaDon.sales_amount || hoaDon.discount || '';

                // Set radio button
                if (hoaDon.payment_method === 'Tiền mặt') {
                    document.getElementById('modal_CASH').checked = true;
                } else if (hoaDon.payment_method === 'Chuyển khoản') {
                    document.getElementById('modal_ONLINE').checked = true;
                } else {
                    document.getElementById('modal_CASH').checked = false;
                    document.getElementById('modal_ONLINE').checked = false;
                }

                var btnSave = document.getElementById('modalSaveBtnHoaDon');
                btnSave.onclick = null;
                btnSave.onclick = async function() {
                    const res = await fetch(`http://localhost:8081/invoice/${id}`);
                    const oldData = await res.json();

                    // Nếu không chọn lại select thì giữ giá trị cũ
                    let regFormId = document.getElementById('modal_id_phieu_dang_ky').value.trim();
                    if (!regFormId) regFormId = oldData.registration_form_id;

                    oldData.registration_form_id = regFormId;
                    oldData.invoice_date = document.getElementById('modal_ngay_tao').value.trim();
                    oldData.total_amount = document.getElementById('modal_tong_tien').value.trim();
                    // Lưu lại sales_amount khi cập nhật
                    oldData.sales_amount = document.getElementById('modal_giam_gia').value.trim();
                    oldData.payment_method = document.querySelector('input[name="modal_phuong_thuc_tt"]:checked')?.value || '';

                    if (!oldData.payment_method) {
                        alert("Vui lòng điền đầy đủ thông tin");
                        return;
                    }

                    updateHoaDon(id, oldData, function() {
                        getHoaDon(renderHoaDon);
                        document.getElementById('modalOverlayHoaDon').style.display = 'none';
                    });
                };

                var btnCancel = document.getElementById('modalCancelBtnHoaDon');
                btnCancel.onclick = function() {
                    document.getElementById('modalOverlayHoaDon').style.display = 'none';
                };
            }
        })
        .catch(function(error) {
            console.error('Error editing hoa_don:', error);
        });
}

function searchHoaDon(searchTerm) {
    fetch('http://localhost:8081/invoice')
        .then(res => res.json())
        .then(function(listHoaDon) {
            const filtered = listHoaDon.filter(function(hoaDon) {
                return hoaDon.registration_form_id
                    .toLowerCase()
                    .includes(searchTerm.trim().toLowerCase());
            });
            renderHoaDon(filtered);
        });
}

// Gắn sự kiện cho nút tìm kiếm
document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    searchButton.addEventListener('click', function() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            searchHoaDon(searchTerm);
        } else {
            getHoaDon(renderHoaDon); 
        }
    });

    searchInput.addEventListener('input', function() {
        if (!searchInput.value.trim()) {
            getHoaDon(renderHoaDon);
        }
    });
});
function start (){
    getHoaDon(renderHoaDon);
}