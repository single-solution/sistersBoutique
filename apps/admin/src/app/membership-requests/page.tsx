import type { Types } from "mongoose";

import { connectDB, MembershipRequest, type MembershipRequestStatus } from "@store/db";

import { adminWorkspacePageClass } from "@/components/shared/workspaceUi";
import { requirePagePermission } from "@/lib/server/requirePageSession";
import { MembershipRequests, type MembershipRequestView } from "@/app/membership-requests/_components/MembershipRequests";

export const dynamic = "force-dynamic";

const LIST_LIMIT = 100;

interface MembershipRequestRow {
	_id: Types.ObjectId;
	name: string;
	phoneNumber: string;
	status: MembershipRequestStatus;
	note?: string;
	invitedAt?: Date;
	completedAt?: Date;
	setupTokenExpiresAt?: Date;
	createdAt: Date;
}

export default async function MembershipRequestsPage() {
	await requirePagePermission("customer_view", "/membership-requests");
	await connectDB();
	const rows = await MembershipRequest.find({}).sort({ createdAt: -1 }).limit(LIST_LIMIT).lean<MembershipRequestRow[]>();

	const requests: MembershipRequestView[] = rows.map((row) => ({
		id: row._id.toString(),
		name: row.name,
		phoneNumber: row.phoneNumber,
		status: row.status,
		note: row.note,
		createdAt: row.createdAt.toISOString(),
		invitedAt: row.invitedAt?.toISOString(),
		completedAt: row.completedAt?.toISOString(),
		linkExpiresAt: row.setupTokenExpiresAt?.toISOString(),
	}));

	return (
		<div className={adminWorkspacePageClass}>
			<MembershipRequests initial={requests} />
		</div>
	);
}
