import axios from "axios";

export async function searchTrains({
  fromStationId,
  toStationId,
  departureDate,
}) {
  const body = {
    searchRoutes: [
      {
        departureStationId: Number(fromStationId),
        arrivalStationId: Number(toStationId),
        departureDate: toTcddApiDate(departureDate),
      },
    ],
    passengerTypeCounts: [{ id: 0, count: 1 }],
  };
  const { data } = await axios.post(process.env.TCDD_API_URL, body, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "tr",
      Authorization: process.env.TCDD_TOKEN,
      Connection: "keep-alive",
      "Content-Type": "application/json",
      Origin: "https://ebilet.tcddtasimacilik.gov.tr",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "unit-id": "3895",
    },
    timeout: 15000,
  });
  const res = simplifyTrips(data, fromStationId, toStationId);
  return res;
}

export function toTcddApiDate(userDate) {
  const [day, month, year] = userDate.split(" ").map(Number);

  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() - 1);

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}-${mm}-${yyyy} 21:00:00`;
}

function formatDuration(startISO, endISO) {
  const diffMs = new Date(endISO) - new Date(startISO);
  const totalMinutes = Math.floor(diffMs / 60000);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours} sa ${minutes} dk` : `${minutes} dk`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    timeZone: "Europe/Istanbul",
  });
}

function utcToTurkeyDate(iso) {
  const date = new Date(iso);
  date.setHours(date.getHours() + 3);
  return date;
}

function formatTimeTR(iso) {
  const d = utcToTurkeyDate(iso);
  return d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractRouteName(commercialName = "") {
  return commercialName.replace(/^YHT\s*/i, "").trim();
}

function extractDepartureArrival(train, fromStationId, toStationId) {
  const segments = train.trainSegments || [];

  const depIndex = segments.findIndex(
    (s) => s.departureStationId === fromStationId,
  );
  const arrIndex = segments.findIndex(
    (s) => s.arrivalStationId === toStationId,
  );

  if (depIndex === -1 || arrIndex === -1 || arrIndex < depIndex) return null;

  const depSeg = segments[depIndex];
  const arrSeg = segments[arrIndex];

  return {
    departureTime: depSeg.departureTime,
    arrivalTime: arrSeg.arrivalTime,

    departure: formatTimeTR(depSeg.departureTime),
    arrival: formatTimeTR(arrSeg.arrivalTime),

    departureStationId: depSeg.departureStationId,
    arrivalStationId: arrSeg.arrivalStationId,
  };
}

function extractSeatCounts(cabinClassAvailabilities = []) {
  let economy = 0;
  let business = 0;

  for (const item of cabinClassAvailabilities) {
    const name = item.cabinClass?.name;

    if (name === "EKONOMİ") economy = item.availabilityCount;
    else if (name === "BUSİNESS") business = item.availabilityCount;
  }

  return { economy, business };
}

/**
 * API response → BOT İÇİN ANLAMLI DATA
 */
function simplifyTrips(apiResponse, fromStationId, toStationId) {
  const trips = [];

  fromStationId = Number(fromStationId);
  toStationId = Number(toStationId);

  for (const leg of apiResponse.trainLegs ?? []) {
    for (const availability of leg.trainAvailabilities ?? []) {
      for (const train of availability.trains ?? []) {
        if (train.type !== "YHT") continue;

        const times = extractDepartureArrival(
          train,
          fromStationId,
          toStationId,
        );

        if (!times) continue;

        const { economy, business } = extractSeatCounts(
          train.cabinClassAvailabilities,
        );

        const duration = formatDuration(times.departureTime, times.arrivalTime);

        trips.push({
          trainId: train.id,
          commercialName: extractRouteName(train.commercialName),
          departureStationId: times.departureStationId,
          arrivalStationId: times.arrivalStationId,
          date: formatDate(times.departureTime),
          departure: times.departure,
          arrival: times.arrival,
          duration,
          economy,
          business,
        });
      }
    }
  }

  return trips;
}
