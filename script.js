const TOTAL_FLOORS = 7;
const FLOOR_HEIGHT = 86;
const CABIN_HEIGHT = 78;

const state = {
  currentFloor: 1,
  direction: 0,
  moving: false,
  doorsOpen: false,
  queue: [],
};

const building = document.getElementById('building');
const externalButtonsContainer = document.getElementById('externalButtons');
const internalButtonsContainer = document.getElementById('internalButtons');
const statusText = document.getElementById('statusText');
const floorText = document.getElementById('floorText');

const openDoorBtn = document.getElementById('openDoorBtn');
const closeDoorBtn = document.getElementById('closeDoorBtn');
const cancelBtn = document.getElementById('cancelBtn');

const shaft = document.createElement('div');
shaft.className = 'shaft';
building.appendChild(shaft);

const cabin = document.createElement('div');
cabin.className = 'cabin';
cabin.innerHTML = `
  <div class="door left"></div>
  <div class="door right"></div>
`;
shaft.appendChild(cabin);

function floorToY(floor) {
  const fromBottom = (floor - 1) * FLOOR_HEIGHT;
  const y = shaft.clientHeight - CABIN_HEIGHT - fromBottom;
  return Math.max(0, y);
}

function renderFloorLabels() {
  for (let floor = 1; floor <= TOTAL_FLOORS; floor += 1) {
    const label = document.createElement('div');
    label.className = 'floor-label';
    label.textContent = `${floor} этаж`;
    label.style.bottom = `${(floor - 1) * FLOOR_HEIGHT + 30}px`;
    building.appendChild(label);
  }
}

function createFloorButtons(container, prefix) {
  for (let floor = TOTAL_FLOORS; floor >= 1; floor -= 1) {
    const button = document.createElement('button');
    button.className = 'floor-btn';
    button.dataset.floor = String(floor);
    button.dataset.type = prefix;
    button.textContent = `${prefix === 'external' ? 'Вызов' : 'Этаж'} ${floor}`;
    button.addEventListener('click', () => enqueueFloor(floor));
    container.appendChild(button);
  }
}

function setStatus(message) {
  statusText.textContent = message;
  floorText.textContent = `Этаж: ${state.currentFloor}`;
}

function setDoors(open) {
  state.doorsOpen = open;
  cabin.classList.toggle('open', open);
  if (open) {
    setStatus('Двери открыты');
  } else {
    setStatus(state.moving ? 'Движение...' : 'Двери закрыты');
  }
}

function highlightQueueButtons() {
  document.querySelectorAll('.floor-btn').forEach((btn) => {
    const floor = Number(btn.dataset.floor);
    btn.classList.toggle('active', state.queue.includes(floor));
  });
}

function enqueueFloor(floor) {
  if (floor < 1 || floor > TOTAL_FLOORS) return;
  if (floor === state.currentFloor && !state.moving) {
    setDoors(true);
    setTimeout(() => {
      setDoors(false);
      setStatus('Ожидание');
    }, 1300);
    return;
  }

  if (!state.queue.includes(floor)) {
    state.queue.push(floor);
    highlightQueueButtons();
  }

  processQueue();
}

async function moveToFloor(targetFloor) {
  if (state.currentFloor === targetFloor) return;

  if (state.doorsOpen) {
    setDoors(false);
    await wait(700);
  }

  state.moving = true;
  state.direction = targetFloor > state.currentFloor ? 1 : -1;
  setStatus(state.direction > 0 ? 'Едем вверх ↑' : 'Едем вниз ↓');

  cabin.style.transform = `translateY(${floorToY(targetFloor)}px)`;

  const distance = Math.abs(targetFloor - state.currentFloor);
  await wait(Math.max(1200, distance * 650));

  state.currentFloor = targetFloor;
  floorText.textContent = `Этаж: ${state.currentFloor}`;
  setStatus(`Прибытие на этаж ${state.currentFloor}`);

  setDoors(true);
  await wait(1700);
  setDoors(false);

  state.moving = false;
  state.direction = 0;
  setStatus('Ожидание');
}

async function processQueue() {
  if (state.moving) return;
  while (state.queue.length) {
    const nextFloor = state.queue.shift();
    highlightQueueButtons();
    await moveToFloor(nextFloor);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function bindServiceButtons() {
  openDoorBtn.addEventListener('click', () => {
    if (state.moving) return;
    setDoors(true);
  });

  closeDoorBtn.addEventListener('click', () => {
    if (state.moving) return;
    setDoors(false);
    setStatus('Ожидание');
  });

  cancelBtn.addEventListener('click', () => {
    state.queue = [];
    highlightQueueButtons();
    if (!state.moving) {
      setStatus('Все заявки отменены');
      setTimeout(() => setStatus('Ожидание'), 1200);
    }
  });
}

function init() {
  renderFloorLabels();
  createFloorButtons(externalButtonsContainer, 'external');
  createFloorButtons(internalButtonsContainer, 'internal');
  bindServiceButtons();
  cabin.style.transform = `translateY(${floorToY(state.currentFloor)}px)`;
  setStatus('Ожидание');
}

window.addEventListener('resize', () => {
  cabin.style.transform = `translateY(${floorToY(state.currentFloor)}px)`;
});

init();
