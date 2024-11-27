
const rows = 12;
const cols = 14;
const seatGrid = document.querySelector('.seat-grid');
const seats = [];

// 좌석 생성 및 초기 상태 설정
for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        const seatNumber = i * cols + j + 1;
        let status;

        // 기본 상태 설정 (미리 정의된 occupied 상태 지정)
        if ([14, 20, 21, 22, 23, 35, 36, 37, 38, 50, 51, 52, 53, 67, 68, 69, 70, 82, 83, 84, 96, 97, 98, 110, 111, 112, 124, 125, 126, 138, 139, 140, 152, 153, 154, 166, 167, 168].includes(seatNumber)) {
            status = 'occupied';
        } else {
            status = 'available';
        }

        const seat = {
            id: seatNumber,
            status: status
        };
        seats.push(seat);

        // 좌석 엘리먼트 생성 및 설정
        const seatElement = document.createElement('div');
        seatElement.classList.add('seat');
        seatElement.textContent = seatNumber;
        if (seat.status === 'occupied') {
            seatElement.classList.add('occupied');
        }
        seatElement.addEventListener('click', () => toggleSeat(seatElement, seat));
        seatGrid.appendChild(seatElement);
    }
}

// 좌석 상태 토글 함수
function toggleSeat(seatElement, seat) {
    // 좌석 상태 변경: available <-> occupied
    if (seat.status === 'available') {
        seat.status = 'occupied';
        seatElement.classList.remove('available');
        seatElement.classList.add('occupied');
    } else if (seat.status === 'occupied') {
        seat.status = 'available';
        seatElement.classList.remove('occupied');
        seatElement.classList.add('available');
    }
}

// JSON 파일 출력 버튼 기능 추가
document.getElementById('jsonButton').addEventListener('click', () => {
    const seatData = {
        seats: seats.map(seat => ({
            id: seat.id,
            status: seat.status
        }))
    };

    const jsonString = JSON.stringify(seatData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'seat_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});
