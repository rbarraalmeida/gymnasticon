/**
 * Workaround for an issue in the bikes that occasionally
 * incorrectly report zero cadence (rpm) or zero power (watts)
 *
 * Power dropouts have been observed on the Flywheel bike
 * Power and cadence dropouts have been observed on the Keiser bike
 *
 * This filter can be used for both bikes.
 */
export function createDropoutFilter() {
  let prev = null;

  /**
   * Returns stats payload with spurious zero removed.
   * @param {object} curr - current stats payload
   * @param {number} curr.power - power (watts)
   * @param {number} curr.cadence - cadence (rpm)
   * @param {string} curr.speed - speed (km/h)
   * @returns {object} fixed - fixed stats payload
   * @returns {object} fixed.power - fixed power (watts)
   * @returns {object} fixed.cadence - cadence
   * @returns {string} fixed.speed - speed (km/h)
   */
  return function (curr) {
    let fixed = {...curr};
    if (prev !== null && curr.power === 0 && (curr.cadence > 0 || parseFloat(curr.speed) > 0) && prev.power > 0) {
      fixed.power = prev.power;
    }
    if (prev !== null && curr.cadence === 0 && (curr.power > 0 || parseFloat(curr.speed) > 0) && prev.cadence > 0) {
      fixed.cadence = prev.cadence;
    }
    if (prev !== null && parseFloat(curr.speed) <= 1.0 && (curr.power > 0 || curr.cadence > 0) && parseFloat(prev.speed) > 1.0) {
      fixed.speed = prev.speed;
    }
    prev = curr;
    return fixed;
  }
}
