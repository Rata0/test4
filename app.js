import { FIRST_SHOW_TIME, LAST_SHOW_TIME, SHOW_INTERVAL, MAX_BOOKING_DAYS } from "./src/constants.js";
import { formatDate, formatTime } from "./src/utilsDate.js";

let time;
let selectedSeats = [];
let bookedSeatsData = {};

const bookedSeatsDataFromStorage = localStorage.getItem('bookedSeatsData');
if (bookedSeatsDataFromStorage) {
  bookedSeatsData = JSON.parse(bookedSeatsDataFromStorage);
}

const loadShowTimes = () => {
  const $timeSelect = $('#time');
  $timeSelect.empty();
  $timeSelect.append('<option value=""> время </option>');

  const currentDate = new Date();
  const formattedDate = formatDate(currentDate);

  for (let hour = FIRST_SHOW_TIME; hour <= LAST_SHOW_TIME; hour += SHOW_INTERVAL) {
    const timeStr = formatTime(hour);
    const key = `${formattedDate} ${timeStr}`;
    if (!bookedSeatsData[key] || bookedSeatsData[key].length < 60) {
      $timeSelect.append(`<option value="${timeStr}">${timeStr}</option>`);
    }
  }
};

const loadSeatingPlan = () => {
  const $seatingPlan = $('#seating-plan');
  $seatingPlan.empty();

  const selectedDate = $('#date').val();
  const selectedTime = $('#time').val();
  time = selectedTime.split(':')[0];
  console.log(time);
  const key = `${selectedDate} ${selectedTime}`;

  const currentDate = new Date();
  const selectedDateTime = new Date(`${selectedDate} ${selectedTime}`);

  if (selectedDateTime.getTime() < currentDate.getTime()) {
    for (let i = 1; i <= 60; i++) {
      const $seat = $('<div class="seat"></div>');
      $seat.data('seatNum', i);

      for (const [archivedKey, archivedData] of Object.entries(bookedSeatsData)) {
        const [archivedDate, archivedTime] = archivedKey.split(' ');
        if (archivedDate === selectedDate && archivedTime === selectedTime && archivedData.includes(i)) {
          $seat.addClass('booked');
          break;
        }
      }

      $seatingPlan.append($seat);
    }
  } else {
    for (let i = 1; i <= 60; i++) {
      const $seat = $('<div class="seat"></div>');
      $seat.data('seatNum', i);
      if (bookedSeatsData[key] && bookedSeatsData[key].includes(i)) {
        $seat.addClass('booked');
      }

      $seat.click(() => {
        const seatNum = $seat.data('seatNum');
        if ($seat.hasClass('booked')) {
          return;
        }

        $seat.toggleClass('selected');
        if ($seat.hasClass('selected')) {
          selectedSeats.push(seatNum);
        } else {
          selectedSeats = selectedSeats.filter(seat => seat !== seatNum);
        }
      });
      $seatingPlan.append($seat);
    }
  }
};

const updateBookedSeats = () => {
  localStorage.setItem('bookedSeatsData', JSON.stringify(bookedSeatsData));
};

$('#date').on('change', () => {
  const selectedDate = new Date($('#date').val());
  const currentDate = new Date();
  const sevenDaysAgo = new Date(currentDate.getTime() - (7 * 24 * 60 * 60 * 1000));

  if (selectedDate < sevenDaysAgo) {
    alert('Вы можете посмотреть забронированные билеты в архиве не более семь дней, начиная с текущей даты.');
    $('#time').prop('disabled', true);
    $('#seating-plan').empty();
    $('#booked-seats-list').empty();
    $('#reserve-btn').prop('disabled', true);
  } else {
    if (selectedDate.toDateString() === currentDate.toDateString()) {
      const selectedTime = Number(time);
      const currentTime = currentDate.getHours();
      console.log(currentDate.getHours(), selectedTime);
      if (selectedTime > currentTime) {
        $('#time').prop('disabled', false);
        loadShowTimes();
        loadSeatingPlan();
        $('#booked-seats-list').empty();
        $('#reserve-btn').prop('disabled', false);
        time = 0;
      } else {
        $('#time').prop('disabled', false);
        loadShowTimes();
        loadSeatingPlan();
        loadPreviousWeekBookings();
        $('#reserve-btn').prop('disabled', true);
      }
    } else if (selectedDate < currentDate) {
      $('#time').prop('disabled', false);
      loadShowTimes();
      loadSeatingPlan();
      loadPreviousWeekBookings();
      $('#reserve-btn').prop('disabled', true);
    } else {
      const maxBookingDate = new Date(currentDate.getTime() + (MAX_BOOKING_DAYS * 24 * 60 * 60 * 1000));
      if (selectedDate > maxBookingDate) {
        $('#time').prop('disabled', true);
        $('#seating-plan').empty();
        $('#booked-seats-list').empty();
        $('#reserve-btn').prop('disabled', true);
        alert('Вы можете забронировать билеты только на следующую неделю, начиная с текущей даты.');
      } else {
        $('#time').prop('disabled', false);
        loadShowTimes();
        loadSeatingPlan();
        $('#booked-seats-list').empty();
        $('#reserve-btn').prop('disabled', false);
      }
    }
  }
});

$('#time').on('change', loadSeatingPlan);

$('#reserve-btn').on('click', () => {
  const selectedDate = $('#date').val();
  const selectedTime = $('#time').val();
  const key = `${selectedDate} ${selectedTime}`;

  if (selectedDate && selectedTime) {
    if (!bookedSeatsData[key]) {
      bookedSeatsData[key] = [];
    }

    selectedSeats.forEach(seat => {
      bookedSeatsData[key].push(seat);
    });
    
    updateBookedSeats();
    alert(`У вас забронированы места ${selectedSeats.join(', ')}.`);
    selectedSeats = [];
    loadSeatingPlan();
  } else {
    alert('Пожалуйста, выберите дату и время.');
  }
});

loadShowTimes();
