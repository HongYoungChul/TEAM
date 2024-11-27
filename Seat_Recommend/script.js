const totalBlocks = 14;
const rowsPerBlock = 2;
const colsPerBlock = 6;
const rowConfiguration = [2, 3, 3, 3, 3];
let seatNumber = 1;

const seatMapContainer = document.getElementById("seatMapContainer");
const seats = [];
let selectedSeat = null;

// 가중치 설정
const weights = {
  corner: 2,
  adjacent: 3,
  window: 1,
};

// JSON 파일 로드 및 초기화
fetch("./seat_data.json")
  .then((response) => response.json())
  .then((data) => {
    const seatDataFromFile = data.seats;

    // 좌석 맵 생성
    rowConfiguration.forEach((blocksInRow) => {
      const seatRow = document.createElement("div");
      seatRow.classList.add("seat-row");

      for (let blockIndex = 0; blockIndex < blocksInRow; blockIndex++) {
        const seatBlock = document.createElement("div");
        seatBlock.classList.add("seat-block");

        for (let col = 0; col < colsPerBlock; col++) {
          for (let row = 0; row < rowsPerBlock; row++) {
            const seat = document.createElement("div");
            seat.classList.add("seat");
            seat.textContent = seatNumber;
            seat.dataset.id = seatNumber;

            const seatData = seatDataFromFile.find(
              (seat) => seat.id === seatNumber
            );
            if (!seatData) {
              console.error(`Seat data missing for seat ID: ${seatNumber}`);
              seatNumber++;
              continue;
            }

            seats.push(seatData);

            if (seatData.status === "occupied") {
              seat.classList.add("occupied");
            } else {
              seat.addEventListener("click", () => {
                if (selectedSeat) selectedSeat.classList.remove("selected");
                seat.classList.add("selected");
                selectedSeat = seat;
                document.getElementById("reserveBtn").disabled = false;
              });
            }

            seatBlock.appendChild(seat);
            seatNumber++;
          }
        }

        seatRow.appendChild(seatBlock);
      }

      seatMapContainer.appendChild(seatRow);
    });

    // 좌석의 행(row), 열(col), 블록(block) 정보 계산
    let currentBlockStart = 0;
    let blockId = 0;
    rowConfiguration.forEach((blocksInRow, rowIndex) => {
      let cumulativeCols = 0;
      for (let block = 0; block < blocksInRow; block++) {
        const blockStartCol = cumulativeCols + 1;
        const blockEndCol = cumulativeCols + colsPerBlock;

        for (let col = 1; col <= colsPerBlock; col++) {
          for (let row = 1; row <= rowsPerBlock; row++) {
            const seatIndex =
              currentBlockStart +
              block * colsPerBlock * rowsPerBlock +
              (row - 1) * colsPerBlock +
              (col - 1);
            if (seatIndex >= seats.length) continue;

            seats[seatIndex].row = rowIndex * rowsPerBlock + row;
            seats[seatIndex].col = cumulativeCols + col;
            seats[seatIndex].block = blockId;
            seats[seatIndex].blockStartCol = blockStartCol;
            seats[seatIndex].blockEndCol = blockEndCol;
          }
        }
        cumulativeCols += colsPerBlock;
        blockId++;
      }
      currentBlockStart += blocksInRow * colsPerBlock * rowsPerBlock;
    });
  })
  .catch((error) => {
    console.error("Error loading seat data:", error);
  });

// 좌석 점수 계산 함수 (AND 또는 OR 조건에 따라 변경)
function calculateSeatScore(seat, selectedOptions, weights, useAndCondition) {
  let score = 0;
  let allConditionsMet = true; // AND 조건에 필요한 플래그

  // 각 조건 확인
  selectedOptions.forEach((option) => {
    if (option === "corner") {
      const isCorner =
        seat.col === seat.blockStartCol || seat.col === seat.blockEndCol;
      if (isCorner) {
        score += weights.corner;
      } else if (useAndCondition) {
        allConditionsMet = false;
      }
    }

    if (option === "adjacent") {
      const leftSeat = seats.find(
        (s) =>
          s.row === seat.row &&
          s.col === seat.col - 1 &&
          s.block === seat.block
      );
      const rightSeat = seats.find(
        (s) =>
          s.row === seat.row &&
          s.col === seat.col + 1 &&
          s.block === seat.block
      );

      const isLeftAvailable = !leftSeat || leftSeat.status === "available";
      const isRightAvailable = !rightSeat || rightSeat.status === "available";

      if (
        (seat.col === seat.blockStartCol && isRightAvailable) ||
        (seat.col === seat.blockEndCol && isLeftAvailable) ||
        (isLeftAvailable && isRightAvailable)
      ) {
        score += weights.adjacent;
      } else if (useAndCondition) {
        allConditionsMet = false;
      }
    }

    if (option === "window") {
      if (seat.col === 1) {
        score += weights.window;
      } else if (useAndCondition) {
        allConditionsMet = false;
      }
    }
  });

  // AND 조건일 경우 모든 조건 만족 여부 체크
  if (useAndCondition && !allConditionsMet) {
    return 0;
  }

  return score;
}

// 옵션 버튼 생성 및 스타일링
const optionsContainer = document.createElement("div");
optionsContainer.classList.add("options-container");
const controlsElement = document.querySelector(".controls");
controlsElement.insertBefore(optionsContainer, controlsElement.firstChild);

const options = [
  { name: "corner", label: "구석자리(끝자리)" },
  { name: "adjacent", label: "옆자리가 비어있는 자리" },
  { name: "window", label: "창가자리" },
];

options.forEach((option) => {
  const button = document.createElement("button");
  button.classList.add("option-button");
  button.textContent = option.label;
  button.dataset.option = option.name;
  button.addEventListener("click", () => {
    button.classList.toggle("selected-option");
  });
  optionsContainer.appendChild(button);
});

// AND/OR 선택 버튼 추가
let useAndCondition = true; // 기본값은 AND 조건
const andOrToggleBtn = document.createElement("button");
andOrToggleBtn.textContent = "Use AND";
andOrToggleBtn.classList.add("toggle-button");
controlsElement.appendChild(andOrToggleBtn);

andOrToggleBtn.addEventListener("click", () => {
  useAndCondition = !useAndCondition;
  andOrToggleBtn.textContent = useAndCondition
    ? "Use AND"
    : "Use OR";
});

document.getElementById("recommendBtn").addEventListener("click", () => {
  const selectedOptions = Array.from(
    document.querySelectorAll(".option-button.selected-option")
  ).map((button) => button.dataset.option);

  if (selectedOptions.length === 0) {
    alert("Please select at least one option.");
    return;
  }

  // 각 좌석에 대해 점수 계산
  const scoredSeats = seats
    .filter((seat) => seat.status === "available")
    .map((seat) => {
      seat.score = calculateSeatScore(seat, selectedOptions, weights, useAndCondition);
      return seat;
    });

  // 점수가 높은 순으로 정렬
  scoredSeats.sort((a, b) => b.score - a.score);

  // 추천 좌석 표시 초기화
  document.querySelectorAll(".seat").forEach((seatElement) => {
    seatElement.classList.remove("recommended");
  });

  // 점수가 0보다 큰 좌석들만 추천으로 표시
  scoredSeats.forEach((seat, index) => {
    if (seat.score > 0) {
      setTimeout(() => {
        const seatElement = document.querySelector(
          `.seat[data-id="${seat.id}"]`
        );
        if (seatElement) {
          seatElement.classList.add("recommended");
        }
      }, index * 10);
    }
  });
});

// 추천 초기화 버튼 추가
const resetRecommendationsBtn = document.createElement("button");
resetRecommendationsBtn.id = "resetRecommendationsBtn";
resetRecommendationsBtn.textContent = "Reset Recommendations";
controlsElement.appendChild(resetRecommendationsBtn);

resetRecommendationsBtn.addEventListener("click", () => {
  document.querySelectorAll(".seat").forEach((seatElement) => {
    seatElement.classList.remove("recommended");
  });
  document.querySelectorAll(".option-button").forEach((button) => {
    button.classList.remove("selected-option");
  });
});

document.getElementById("reserveBtn").addEventListener("click", () => {
  if (selectedSeat) {
    const seatId = parseInt(selectedSeat.dataset.id, 10);
    const seatIndex = seats.findIndex((seat) => seat.id === seatId);
    seats[seatIndex].status = "occupied";

    selectedSeat.classList.remove("selected");
    selectedSeat.classList.add("occupied");
    selectedSeat = null;

    document.querySelectorAll(".option-button").forEach((button) => {
      button.classList.remove("selected-option");
    });

    document.querySelectorAll(".seat").forEach((seatElement) => {
      seatElement.classList.remove("recommended");
    });

    document.getElementById("reserveBtn").disabled = true;

    const blob = new Blob([JSON.stringify({ seats }, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "seat_data.json";
    link.click();
  }
});
