// https://docs.docker.com/reference/compose-file/extension/#specifying-durations
/*
10ms
40s
1m30s
1h5m30s20ms
*/

type Unit = 'ms' | 's' | 'm' | 'h';

type Milliseconds = `${number}ms`;
type Seconds = `${number}s`;
type Minutes = `${number}m`;
type Hours = `${number}h`;

type DockerDuration = `${Hours | ''}${Minutes | ''}${Seconds | ''}${Milliseconds | ''}`;

export default DockerDuration;
