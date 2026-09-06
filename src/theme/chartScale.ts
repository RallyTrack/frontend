/**
 * 차트 축 스케일 유틸.
 *
 * recharts에 domain/ticks를 맡기면 데이터 최댓값에 따라 0.5 같은 소수 눈금을
 * 만들고, 최댓값이 눈금 사이에 걸치면 막대 끝이 격자선과 어긋난다.
 * 건수(회/개)를 다루는 축은 아래 규칙으로 직접 계산해서 넘긴다.
 */

/**
 * 정수 카운트 축의 눈금과 domain을 계산한다.
 *
 * - step은 항상 1 이상의 정수 → 0.5 눈금이 생기지 않는다.
 * - 총량이 커지면 단위도 함께 커진다 (1 → 2 → 5 → 10 → 25 → 50 → 100 …).
 *   짧은 영상은 1단위, 스트로크가 수십~수백 개인 긴 영상은 자동으로 굵은 단위.
 * - domain 상단을 step의 배수로 올려서 최댓값이 항상 눈금 위에 정확히 얹히게 한다.
 *   (이게 없으면 "3에서 4로 가는 구간만 짧아 보이는" 어긋남이 생긴다)
 *
 * @param maxValue 데이터의 최댓값
 * @param targetTicks 원하는 눈금 개수(0 제외 대략치)
 */
export function niceCountAxis(
  maxValue: number,
  targetTicks = 5,
): { domain: [number, number]; ticks: number[] } {
  const max = Math.max(0, Math.ceil(Number(maxValue) || 0));
  if (max <= 0) return { domain: [0, 1], ticks: [0, 1] };

  const rough = max / Math.max(1, targetTicks);
  const mag = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  const norm = rough / mag;
  // 1 → 2 → 5 → 10 사다리. 2.5 단계는 mag가 10 이상일 때만 허용한다
  // (작은 수에서 2.5를 쓰면 3 같은 어색한 단위가 나온다. 큰 수에서는 25·250을 준다)
  const nice =
    norm <= 1 ? 1
      : norm <= 2 ? 2
        : mag >= 10 && norm <= 2.5 ? 2.5
          : norm <= 5 ? 5
            : 10;
  const step = Math.max(1, Math.round(nice * mag));

  const upper = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= upper; v += step) ticks.push(v);
  return { domain: [0, upper], ticks };
}

/** 여러 시리즈를 한 축에 얹을 때 쓰는 최댓값 헬퍼 */
export function maxOf<T>(rows: T[], pick: (row: T) => number): number {
  return rows.reduce((m, r) => Math.max(m, Number(pick(r)) || 0), 0);
}
