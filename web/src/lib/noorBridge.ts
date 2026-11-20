/** Opens the Noor panel from anywhere. Does nothing on screens where Noor is hidden. */
export function openNoor() {
  document.querySelector<HTMLButtonElement>("[data-noor-launcher]")?.click();
}
