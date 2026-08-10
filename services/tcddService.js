import axios from "axios";

const ATTEMPT_TIMEOUT_MS = 12000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;

const TRANSIENT_ERROR_CODES = new Set([
  "ECONNABORTED",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "ENOTFOUND",
  "EPIPE",
  "ERR_NETWORK",
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransient = (err) => {
  const status = err?.response?.status;
  if (Number.isFinite(status)) {
    return status >= 500 || status === 408 || status === 429;
  }
  return TRANSIENT_ERROR_CODES.has(err?.code);
};

const buildHeaders = () => ({
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "tr",
  Authorization: process.env.TCDD_TOKEN,
  Connection: "keep-alive",
  "Content-Type": "application/json",
  Origin: "https://ebilet.tcddtasimacilik.gov.tr",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
  Referer: "https://ebilet.tcddtasimacilik.gov.tr/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
  "unit-id": "3895",
  "sec-ch-ua":
    '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  Cookie: "mycustomtraceid=rBiqDGm8ZXWjO4vaXsF5Ag==",
});

export async function searchTrains({
  fromStationId,
  toStationId,
  departureDate,
}) {
  if (!process.env.TCDD_API_URL || !process.env.TCDD_TOKEN) {
    const err = new Error("TCDD_API_URL / TCDD_TOKEN tanımlı değil");
    err.code = "MISSING_CONFIG";
    throw err;
  }

  const from = Number(fromStationId);
  const to = Number(toStationId);

  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    const err = new Error("İstasyon kodları sayısal olmalıdır");
    err.code = "INVALID_STATION";
    throw err;
  }

  const body = {
    searchRoutes: [
      {
        departureStationId: from,
        arrivalStationId: to,
        departureDate: toTcddApiDate(departureDate),
      },
    ],
    passengerTypeCounts: [{ id: 0, count: 1 }],
  };

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await axios.post(process.env.TCDD_API_URL, body, {
        headers: buildHeaders(),
        timeout: ATTEMPT_TIMEOUT_MS,
      });

      return simplifyTrips(data, from, to);
    } catch (err) {
      lastError = err;

      if (attempt === MAX_ATTEMPTS || !isTransient(err)) break;

      console.warn(
        `[TCDD] ${attempt}. deneme başarısız (${err.code || err.response?.status}), tekrar deneniyor`,
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

export function toTcddApiDate(userDate) {
  const [day, month, year] = String(userDate ?? "")
    .trim()
    .split(" ")
    .map(Number);

  if (![day, month, year].every(Number.isFinite)) {
    const err = new Error("Tarih formatı geçersiz (DD MM YYYY)");
    err.code = "INVALID_DATE";
    throw err;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    const err = new Error("Tarih geçersiz (DD MM YYYY)");
    err.code = "INVALID_DATE";
    throw err;
  }

  date.setUTCDate(date.getUTCDate() - 1);

  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();

  return `${dd}-${mm}-${yyyy} 21:00:00`;
}

const TR_TIME_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const TR_DATE_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
});

function toValidDate(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDuration(startISO, endISO) {
  const start = toValidDate(startISO);
  const end = toValidDate(endISO);
  if (!start || !end) return "";

  const totalMinutes = Math.floor((end - start) / 60000);
  if (totalMinutes < 0) return "";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours} sa ${minutes} dk` : `${minutes} dk`;
}

function formatDate(iso) {
  const date = toValidDate(iso);
  return date ? TR_DATE_FORMAT.format(date) : "";
}

function formatTimeTR(iso) {
  const date = toValidDate(iso);
  return date ? TR_TIME_FORMAT.format(date) : "";
}

function extractRouteName(commercialName = "") {
  return String(commercialName)
    .replace(/^YHT\s*/i, "")
    .trim();
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

  return { economy: Number(economy) || 0, business: Number(business) || 0 };
}

/**
 * API response → BOT İÇİN ANLAMLI DATA
 */
function simplifyTrips(apiResponse, fromStationId, toStationId) {
  const trips = [];

  fromStationId = Number(fromStationId);
  toStationId = Number(toStationId);

  for (const leg of apiResponse?.trainLegs ?? []) {
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
