/* POK freestanding build shim, port version 1.
 * The selected upstream files include stdio.h but call no stdio declarations.
 * Deliberately declares nothing: accidental stdio use must fail compilation.
 * This does not modify the upstream evaluator or its generated tables.
 */
#ifndef POK_PH_EMPTY_STDIO_H
#define POK_PH_EMPTY_STDIO_H
#endif
