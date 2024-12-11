import { type Volume } from '@nodevisor/cluster';
import type DockerVolume from './DockerVolume';

type ServiceVolume = Volume & DockerVolume;

export default ServiceVolume;
