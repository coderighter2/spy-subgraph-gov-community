import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  ProposalCanceled,
  ProposalCreated,
  ProposalExecuted,
  VoteCast
} from "../generated/SpyCommunityGovernor/SpyCommunityGovernor"
import { ProposalSummary, Proposal, ProposalEvent, Vote } from "../generated/schema"
import { STATUS_ACTIVE, STATUS_CANCELED, STATUS_EXECUTED, STATUS_PENDING, STATUS_QUEUED, STATUS_SUCCEEDED, ZERO_BI } from "./utils";

function recordProposalEvent(proposalId: string, timestamp: i32, state: string, transaction: Bytes|null = null): void {

  let proposalEvent = ProposalEvent.load(proposalId.concat("-").concat(state));
  if (proposalEvent === null) {
    proposalEvent = new ProposalEvent(proposalId.concat("-").concat(state))
    proposalEvent.timestamp = timestamp
    proposalEvent.state = state
    proposalEvent.proposal = proposalId
    if (!!transaction) {
      proposalEvent.txid = transaction
    }
    proposalEvent.save()
  }
}
export function handleProposalCreated(event: ProposalCreated): void {
  let proposal = new Proposal(event.address.toHex().concat("-").concat(event.params.proposalId.toString()))
  proposal.proposalId = event.params.proposalId;
  proposal.proposer = event.params.proposer;
  proposal.startTime = event.params.startTime.toI32();
  proposal.endTime = event.params.endTime.toI32();
  proposal.expiringTime = event.params.expiringTime.toI32();
  proposal.description = event.params.description;
  proposal.timestamp = event.block.timestamp.toI32();
  proposal.lastUpdateTimestamp = event.block.timestamp.toI32();
  proposal.state = event.block.timestamp.toI32() >= proposal.startTime ? STATUS_ACTIVE : STATUS_PENDING;
  proposal.totalCurrentVoters = 0;
  proposal.currentYesVote = ZERO_BI;
  proposal.currentNoVote = ZERO_BI;
  proposal.currentYesVoteCount = 0;
  proposal.currentNoVoteCount = 0;
  proposal.txid = event.transaction.hash
  proposal.save();

  recordProposalEvent(
    proposal.id,
    event.block.timestamp.toI32(),
    STATUS_PENDING,
    event.transaction.hash
  )

  let proposalSummary = ProposalSummary.load(event.address.toHex());
  if (proposalSummary !== null) {
    proposalSummary.proposalCount = proposalSummary.proposalCount + 1;
  } else {
    proposalSummary = new ProposalSummary(event.address.toHex());
    proposalSummary.proposalCount = 1;
  }
  proposalSummary.save();
}


export function handleProposalCanceled(event: ProposalCanceled): void {
  let proposalId = event.address.toHex().concat("-").concat(event.params.proposalId.toString())
  let proposal = Proposal.load(proposalId)
  if (proposal !== null) {
    proposal.state = STATUS_CANCELED;
    proposal.canceledAt = event.block.timestamp.toI32();
    proposal.lastUpdateTimestamp = event.block.timestamp.toI32();
    proposal.save()

    recordProposalEvent(
      proposal.id,
      event.block.timestamp.toI32(),
      STATUS_CANCELED,
      event.transaction.hash
    )
  }
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  let proposalId = event.address.toHex().concat("-").concat(event.params.proposalId.toString())
  let proposal = Proposal.load(proposalId)
  if (proposal !== null) {
    proposal.state = STATUS_EXECUTED;
    proposal.executedAt = event.block.timestamp.toI32();
    proposal.lastUpdateTimestamp = event.block.timestamp.toI32();
    proposal.save()

    recordProposalEvent(
      proposal.id,
      event.block.timestamp.toI32(),
      STATUS_EXECUTED,
      event.transaction.hash
    )
  }
}

export function handleVoteCast(event: VoteCast): void {
  let voteId = event.address.toHex().concat("-").concat(event.params.voter.toString())
  let proposalId = event.address.toHex().concat("-").concat(event.params.proposalId.toString())

  let proposal = Proposal.load(proposalId)
  if (proposal !== null) {
    proposal.totalCurrentVoters = proposal.totalCurrentVoters + 1;
    proposal.lastUpdateTimestamp = event.block.timestamp.toI32();
    if (event.params.support === 1) {
      proposal.currentYesVote = proposal.currentYesVote.plus(event.params.weight);
      proposal.currentYesVoteCount = proposal.currentYesVoteCount + 1;
    } else if (event.params.support === 0) {
      proposal.currentNoVote = proposal.currentNoVote.plus(event.params.weight);
      proposal.currentNoVoteCount = proposal.currentNoVoteCount + 1;
    }
    proposal.state = STATUS_ACTIVE;
    proposal.save();

    recordProposalEvent(
      proposal.id,
      event.block.timestamp.toI32(),
      STATUS_ACTIVE
    )

    let vote = new Vote(voteId)
    vote.voter = event.params.voter;
    vote.support = event.params.support;
    vote.reason = event.params.reason;
    vote.weight = event.params.weight;
    vote.proposal = proposal.id;
    vote.txid = event.transaction.hash
    vote.save();
  }
}
