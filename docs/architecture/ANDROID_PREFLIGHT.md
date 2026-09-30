# Android preflight

Status: **PREFLIGHT COMPLETE; WRAPPER, APK BUILD, AND DEVICE TEST NOT_RUN**. Observed 2026-09-30 (latest fixed-path probe 09:56 UTC). This report records the workstation probes and upstream documentation inspected for the Android phase. It does not attest that an APK builds or runs.

The source Git root was verified as the isolated strategy worktree, branch `feature/river-strategy-android`. The shared web regression gate must pass before wrapper generation or APK building. Existing served websites and notebooks remain independent. Exact workstation path evidence is retained privately rather than published here.

## Observed toolchain

| Component | Observed evidence | Readiness and limitations |
| --- | --- | --- |
| Node | `node --version`: `v26.8.1` | Executable/version verified; Capacitor build not run. |
| JDK | Eclipse Adoptium installed JDK; `java -version`: `openjdk version "21.0.12.1" 2026-08-18 LTS`, `Temurin-21.0.12.1+1`; `javac -version`: `javac 21.0.12.1` | Both executables verified. Use this existing JDK through a task-scoped process or project configuration; no global `JAVA_HOME`/PATH changes. |
| Android SDK | Existing `%LOCALAPPDATA%/Android/sdk`; API 36 platform revision 2, extension 17, base SDK; `android.jar` present | Suitable candidate compile SDK. API 37.0 revision 2 also exists, but its presence is not a reason to change the upstream template. |
| Build tools | `36.0.0`; `aapt2.exe` and `apksigner.bat` present | Installed files checked; no compilation or signing invocation yet. |
| SDK command-line tools | `source.properties`: revision `23.0` | Installed metadata checked. No SDK packages installed or updated. |
| adb | `adb version`: `1.0.41`, platform-tools `37.0.1-15733141` | Executable/version verified. `adb devices -l` reported no targets. |
| Emulator | Revision `37.1.11`, build `15917651` | Installed metadata; `emulator -list-avds` returned no entries. SDK `system-images` directory absent. No emulator started. |
| Android Studio | Installed executable present; `product-info.json`: `AI-261.26222.65.2613.15948027`, data directory `AndroidStudio2026.1.3`, minimum Java 21 | Installed metadata only; IDE not launched. |
| Gradle | No wrapper cache observed in the bounded usual per-user wrapper directory | No Gradle version/build execution. A project-local wrapper will need its pinned distribution and dependencies if they are not cached. No global Gradle installation required. |
| SDK license markers | Nonempty `android-sdk-license` and `android-sdk-preview-license` files present | Filenames/presence only; contents not read or copied. Existing markers do not establish consent for future packages. No terms accepted. |

The probes read known executable versions, package manifests, limited directory inventories, and adb device inventory. They did not modify SDK packages, launch devices, install APKs, change workstation configuration, or inspect unrelated personal data.

## Pinned candidate and provenance

The npm registry returned `8.5.2` and MIT for `@capacitor/core`, `@capacitor/android`, and `@capacitor/cli`; CLI declares Node `>=22.0.0`. These are **proposed exact pins, not installed dependencies** at this checkpoint. Existing Node 26.8.1 meets that declared requirement; actual project compatibility remains a build/test question.

The [Capacitor 8.5.2 Android template variables](https://raw.githubusercontent.com/ionic-team/capacitor/8.5.2/android-template/variables.gradle), [template build file](https://raw.githubusercontent.com/ionic-team/capacitor/8.5.2/android-template/build.gradle), and [wrapper properties](https://raw.githubusercontent.com/ionic-team/capacitor/8.5.2/android-template/gradle/wrapper/gradle-wrapper.properties) specify minimum API 24, compile/target API 36, Android Gradle Plugin 8.13.0, and Gradle 8.14.3. The [native library build file](https://raw.githubusercontent.com/ionic-team/capacitor/8.5.2/android/capacitor/build.gradle) specifies Java source/target 21. The installed Java and SDK therefore support this candidate without an SDK/toolchain upgrade. The upstream [MIT notice](https://raw.githubusercontent.com/ionic-team/capacitor/8.5.2/LICENSE) must be retained. Transitive notices and the installed wrapper will be inventoried after the build gate; their review is not claimed here.

Official [environment setup](https://capacitorjs.com/docs/getting-started/environment-setup), [Android support](https://capacitorjs.com/docs/android), [8.0 migration](https://capacitorjs.com/docs/updating/8-0), and [8.5 migration](https://capacitorjs.com/docs/updating/8-5) were checked on 2026-09-30. Version 8 supports Android API 24 and newer; the 8.5 migration change described there concerns iOS lifecycle support. Installed packages, not documentation examples, establish local availability.

## Shared-web wrapper plan — pending the web gate

1. Keep the existing React/TypeScript rules and analysis workers. Root owns a dedicated Vite `android` mode and build output, proposed `android-dist`, with base `./` so bundled scripts/assets resolve inside the app. Do not change the existing Apache bases.
2. Put the wrapper under `mobile/pok-android`, using only project-local pinned Capacitor packages and their lockfile. `webDir` points to the built Android assets. Use the packaged secure origin `https://localhost` with stable app identity. Omit `server.url`, keep cleartext disabled, and do not broaden navigation to arbitrary remote origins. These options follow [Capacitor configuration](https://capacitorjs.com/docs/config); final config must be inspected and tested.
3. Use a dedicated Android notebook namespace while retaining the existing versioned export/import format. An app WebView has independent storage from the PC browser, even when the hostname looks similar. Import/export is explicit; the wrapper must not imply it synchronized the PC notebook. An Android update with the same package identity must preserve its app storage; uninstall/app-data deletion may remove it.
4. Keep assets, lessons, evaluation, and worker computation local. No PC server address or online account/model is required for ordinary play. Native analysis services unavailable on Android must stay explicitly unavailable rather than falling back to a PC URL.
5. Use a small native document bridge: Android Storage Access Framework `ACTION_OPEN_DOCUMENT` and `ACTION_CREATE_DOCUMENT` for user-selected JSON, the existing validated/capped import format, and a bounded temporary export with a content URI for sharing. No broad storage permission, directory-tree grant, arbitrary path, shell, or raw engine endpoint. The official [document access guide](https://developer.android.com/training/data-storage/shared/documents-files) documents user-directed access without broad storage permissions. Final MIME, size limits, permissions, and share URI lifetime need implementation tests.
6. Root wires app-background events to cancel active calculations. Test interruption/re-entry without awards, duplicate actions, or lost pending state. Respect safe-area insets, keyboard/reflow, system text scale, and the existing reduced-motion preference. Do not draw fake operating-system window controls.
7. Use a project Gradle wrapper and task-scoped JDK selection. [Android JDK guidance](https://developer.android.com/build/jdks) supports project-level selection; the existing JDK will be used without changing global environment variables. First build may download the exact Gradle/Maven artifacts; no SDK license acceptance may be automated silently.

## Gates and blockers

| Gate | Current state | Required evidence |
| --- | --- | --- |
| Shared web regression | WAITING ON ROOT | Passing regression checkpoint before wrapper generation/build. |
| Wrapper and dependency notices | NOT_RUN | Pinned install, generated/configured wrapper inspected, licenses/notices recorded. |
| APK build/installable package | NOT_RUN | Actual Gradle build, package inspection, checksum; debug distribution clearly labelled. |
| Owned test target | BLOCKED | No adb target or AVD exists. An authorized connected personal device, or an explicitly approved emulator setup with applicable package terms, is required. Do not infer ownership from a future serial number. |
| Device offline gameplay/persistence/import/share | NOT_RUN | Real installed APK on the identified owned target with documented Android/WebView versions and screenshots. |
| Production signing/store distribution | OUT OF SCOPE | No signing identity, store account, or store publication is assumed or requested by this preflight. |

No APK, wrapper, emulator image, or installation result is delivered by this preflight. No new legal terms were accepted, no paid API call was made, and no website was deployed or published.
