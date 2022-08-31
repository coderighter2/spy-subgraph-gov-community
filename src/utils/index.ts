import { BigInt } from "@graphprotocol/graph-ts";

export const STATUS_PENDING = 'Pending';
export const STATUS_CANCELED = 'Canceled';
export const STATUS_EXECUTED = 'Executed';
export const STATUS_FAILED = 'Failed';
export const STATUS_QUEUED = 'Queued';
export const STATUS_ACTIVE = 'Active';
export const STATUS_SUCCEEDED = 'Succeeded';

export const YES_WINS = 'Yes';
export const NO_WINS = 'No';
export const ABSTAIN_WINS = 'Abstain';

export let ZERO_BI = BigInt.fromI32(0);