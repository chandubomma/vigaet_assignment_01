import prisma from '../prisma/client.js';


const sendMeetingRequest = async (req, res) => {
    const { guideId, preferredTime } = req.body;

    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const guide = await prisma.user.findUnique({ where: { id: guideId } });

        if (!guide) {
            return res.status(404).json({ message: 'Guide not found' });
        }

        const existingRequest = await prisma.meetingRequest.findFirst({
            where: {
                userId: user.id,
                guideId: guide.id,
                status: { in: ['PENDING'] }
            }
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'You already have a pending request with this guide' });
        }
        const formattedPreferredTime = new Date(preferredTime).toISOString();
        const request = await prisma.meetingRequest.create({
            data: {
                userId: user.id,
                guideId: guide.id,
                preferredTime:formattedPreferredTime,
                status: 'PENDING',
            },
        });

        res.status(201).json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error',error:error });
    }
};


const getMeetingRequests = async (req, res) => {
    const { status} = req.query;

    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        let filter = {};

        if (status) {
            filter.status = status;
        }


        const requests = await prisma.meetingRequest.findMany({
            where: {
                ...filter,
                OR: [
                    { userId: user.id },
                    { guideId: user.id },
                ],
            },
            include: {
                user: true,
                guide: true,
            }
        });

        res.status(200).json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMeetings = async (req, res) => {
    try {
        const userId = req.user?.id;

        const meetingsAsParticipant = await prisma.meeting.findMany({
            where: {
                participants: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
                host: true,
            },
        });

        const meetingsAsHost = await prisma.meeting.findMany({
            where: {
                hostId: userId,
            },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
                host: true,
            },
        });

        const allMeetings = [...meetingsAsParticipant, ...meetingsAsHost];

        const uniqueMeetings = allMeetings.filter(
            (meeting, index, self) =>
                index === self.findIndex((m) => m.id === meeting.id)
        );

        res.status(200).json(uniqueMeetings);
    } catch (error) {
        console.error('Error retrieving meetings:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMeetingById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const meeting = await prisma.meeting.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
                host: true,
            },
        });

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        const isParticipant = meeting.participants.some(participant => participant.userId === user.id) || meeting.hostId === user.id;

        if (!isParticipant) {
            return res.status(403).json({ message: 'You do not have access to this meeting' });
        }

        res.status(200).json(meeting);
    } catch (error) {
        console.error('Error retrieving meeting:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateMeetingRequestStatus = async (req, res) => {
    const { requestId, status } = req.body;

    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const request = await prisma.meetingRequest.findUnique({
            where: { id: requestId },
            include: { guide: true }
        });

        if (!request) {
            return res.status(404).json({ message: 'Meeting request not found' });
        }

        if (request.guideId !== user.id) {
            return res.status(403).json({ message: 'Not authorized to update this request' });
        }

        if (status === 'ACCEPT') {
            const meeting = await prisma.meeting.create({
                data: {
                    hostId: user.id,
                    scheduledAt: request.preferredTime,
                    status: 'TO_BE_HAPPEN',
                    participants: {
                        create: [
                            { userId: request.userId },
                            { userId: user.id }
                        ]
                    }
                },
                include: {
                    participants: true,
                }
            });

            await prisma.meetingRequest.update({
                where: { id: requestId },
                data: { status: 'ACCEPTED' }
            });

            return res.status(200).json({ message: 'Meeting request accepted and meeting scheduled', meeting });
        }

        if (status === 'REJECT') {
            await prisma.meetingRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED' }
            });

            return res.status(200).json({ message: 'Meeting request rejected' });
        }

        res.status(400).json({ message: 'Invalid status or missing preferred time' });
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error', error: error });
    }
};



const cancelMeetingRequest = async (req, res) => {
    const { requestId } = req.params;

    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Convert requestId to an integer
        const requestIdInt = parseInt(requestId, 10);

        const request = await prisma.meetingRequest.findUnique({
            where: { id: requestIdInt },
        });

        if (!request) {
            return res.status(404).json({ message: 'Meeting request not found' });
        }

        if (request.userId !== user.id) {
            return res.status(403).json({ message: 'Not authorized to cancel this request' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ message: 'Only pending requests can be cancelled' });
        }

        await prisma.meetingRequest.update({
            where: { id: requestIdInt }, // Use the integer ID
            data: { status: 'CANCELLED' }
        });

        res.status(200).json({ message: 'Meeting request cancelled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error });
    }
};


export { sendMeetingRequest, getMeetingRequests, getMeetings, getMeetingById, updateMeetingRequestStatus ,cancelMeetingRequest};