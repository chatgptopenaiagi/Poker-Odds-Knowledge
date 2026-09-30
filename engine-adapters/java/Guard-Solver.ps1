[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][ValidateRange(1,2147483647)][int]$ChildPid,
 [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$OwnerToken
)
$ErrorActionPreference='Stop'
# This helper is never an HTTP endpoint. The server supplies only its newly spawned
# child PID and random ownership token, before permitting any solver input.
$jobHandle=[IntPtr]::Zero
$childHandle=[IntPtr]::Zero
try {
 $runtimePath=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../.pok-strategy/runtime.json'))
 $runtime=Get-Content -Raw -LiteralPath $runtimePath | ConvertFrom-Json
 if(!$runtime.javaPath -or $runtime.javaSha256 -notmatch '^[a-f0-9]{64}$'){throw 'approved_runtime_missing'}
 $trustedJava=[IO.Path]::GetFullPath([string]$runtime.javaPath)
 if((Get-FileHash -LiteralPath $trustedJava -Algorithm SHA256).Hash.ToLowerInvariant() -ne $runtime.javaSha256){throw 'approved_runtime_hash_mismatch'}
 Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PokSolverJob {
 [StructLayout(LayoutKind.Sequential)] public struct BasicLimit {
  public long PerProcessUserTimeLimit, PerJobUserTimeLimit;
  public uint LimitFlags;
  public UIntPtr MinimumWorkingSetSize, MaximumWorkingSetSize;
  public uint ActiveProcessLimit;
  public UIntPtr Affinity;
  public uint PriorityClass, SchedulingClass;
 }
 [StructLayout(LayoutKind.Sequential)] public struct IoCounters {
  public ulong ReadOperationCount, WriteOperationCount, OtherOperationCount;
  public ulong ReadTransferCount, WriteTransferCount, OtherTransferCount;
 }
 [StructLayout(LayoutKind.Sequential)] public struct ExtendedLimit {
  public BasicLimit BasicLimitInformation; public IoCounters IoInfo;
  public UIntPtr ProcessMemoryLimit, JobMemoryLimit, PeakProcessMemoryUsed, PeakJobMemoryUsed;
 }
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] public static extern IntPtr CreateJobObject(IntPtr attributes,string name);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool SetInformationJobObject(IntPtr job,int info,ref ExtendedLimit value,uint size);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool QueryInformationJobObject(IntPtr job,int info,out ExtendedLimit value,uint size,IntPtr returnLength);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern IntPtr OpenProcess(uint access,bool inherit,int id);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)] public static extern bool QueryFullProcessImageName(IntPtr process,uint flags,System.Text.StringBuilder image,ref uint size);
 [DllImport("kernel32.dll",SetLastError=true)] public static extern bool CloseHandle(IntPtr handle);
}
'@
 $childHandle=[PokSolverJob]::OpenProcess(0x1101,$false,$ChildPid)
 if($childHandle -eq [IntPtr]::Zero){throw 'owned_child_unavailable'}
 $image=[Text.StringBuilder]::new(1024);[uint32]$imageLength=1024
 if(![PokSolverJob]::QueryFullProcessImageName($childHandle,0,$image,[ref]$imageLength)){throw 'child_image_unverified'}
 if(![string]::Equals([IO.Path]::GetFullPath($image.ToString()),[IO.Path]::GetFullPath($trustedJava),[StringComparison]::OrdinalIgnoreCase)){throw 'child_image_not_allowed'}
 $process=Get-CimInstance -ClassName Win32_Process -Filter "ProcessId=$ChildPid" -Property CommandLine,ProcessId
 $tokenPattern='(?:^|\s|")-Dpok\.ownerToken='+[regex]::Escape($OwnerToken)+'(?=\s|"|$)'
 if(!$process -or ![regex]::IsMatch([string]$process.CommandLine,$tokenPattern)){throw 'child_ownership_unverified'}
 $jobHandle=[PokSolverJob]::CreateJobObject([IntPtr]::Zero,$null)
 if($jobHandle -eq [IntPtr]::Zero){throw 'job_creation_failed'}
 $limits=[PokSolverJob+ExtendedLimit]::new()
 $basic=[PokSolverJob+BasicLimit]::new()
 $basic.LimitFlags=0x2100 # process memory plus kill-on-job-close
 $limits.BasicLimitInformation=$basic # struct copy must be assigned back explicitly
 $limits.ProcessMemoryLimit=[UIntPtr]::new([uint64]536870912)
 $size=[Runtime.InteropServices.Marshal]::SizeOf($limits)
 if(![PokSolverJob]::SetInformationJobObject($jobHandle,9,[ref]$limits,$size)){throw 'job_limits_failed'}
 if(![PokSolverJob]::AssignProcessToJobObject($jobHandle,$childHandle)){throw 'job_attach_failed'}
 $confirmed=[PokSolverJob+ExtendedLimit]::new()
 if(![PokSolverJob]::QueryInformationJobObject($jobHandle,9,[ref]$confirmed,$size,[IntPtr]::Zero) -or $confirmed.ProcessMemoryLimit.ToUInt64() -ne 536870912 -or ($confirmed.BasicLimitInformation.LimitFlags -band 0x2100) -ne 0x2100){throw 'job_limits_unverified'}
 [PokSolverJob]::CloseHandle($childHandle) | Out-Null;$childHandle=[IntPtr]::Zero
 [Console]::Out.WriteLine('{"type":"ready","memoryLimitBytes":536870912,"killOnClose":true}')
 [Console]::Out.Flush()
 # EOF is the parent's completion/cancellation signal. No commands are read.
 while([Console]::In.ReadLine() -ne $null){}
 $measurement=[PokSolverJob+ExtendedLimit]::new()
 if([PokSolverJob]::QueryInformationJobObject($jobHandle,9,[ref]$measurement,$size,[IntPtr]::Zero)){
  [Console]::Out.WriteLine((@{type='closed';peakProcessCommittedBytes=$measurement.PeakProcessMemoryUsed.ToUInt64();memoryLimitBytes=536870912}|ConvertTo-Json -Compress))
  [Console]::Out.Flush()
 }
} catch {
 $code=[string]$_.Exception.Message
 if($code -notmatch '^[a-z_]{1,80}$'){$code='memory_guard_failed'}
 [Console]::Out.WriteLine((@{type='error';code=$code}|ConvertTo-Json -Compress));[Console]::Out.Flush()
 exit 2
} finally {
 if($childHandle -ne [IntPtr]::Zero){[PokSolverJob]::CloseHandle($childHandle)|Out-Null}
 if($jobHandle -ne [IntPtr]::Zero){[PokSolverJob]::CloseHandle($jobHandle)|Out-Null}
}
