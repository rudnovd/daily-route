export async function timeout(ms: number): Promise<number> {
  return await new Promise(resolve => setTimeout(resolve, ms))
}
