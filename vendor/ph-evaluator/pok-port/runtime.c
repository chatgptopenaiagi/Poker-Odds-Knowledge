/* POK freestanding build shim, port version 1.
 * Supports compiler-emitted zero initialization without WASI/libc imports.
 * Built with -fno-builtin so this loop cannot recursively call itself.
 */
void *memset(void *destination, int value, __SIZE_TYPE__ count) {
  unsigned char *bytes = (unsigned char *)destination;
  for (__SIZE_TYPE__ i = 0; i < count; i++) bytes[i] = (unsigned char)value;
  return destination;
}
