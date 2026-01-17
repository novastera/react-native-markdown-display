let uuid = new Date().getTime();

export default function getUniqueID(): string {
  uuid++;
  return `rnmr_${uuid.toString(16)}`;
}
