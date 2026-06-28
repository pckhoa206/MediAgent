import { NextResponse } from 'next/server';
import { getMockUsers, saveMockUser } from '../mockDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cccd, password, role, fullName, dob, gender, doctorId } = body;

    if (!cccd || !password || !role || !fullName) {
      return NextResponse.json(
        { message: 'All required fields must be filled in.' },
        { status: 400 }
      );
    }

    if (role === 'doctor' && !doctorId) {
      return NextResponse.json(
        { message: 'Doctor ID is required for Doctor accounts.' },
        { status: 400 }
      );
    }

    const currentUsers = getMockUsers();

    // Check for duplicate registration
    if (currentUsers[cccd]) {
      return NextResponse.json(
        { message: 'An account with this Citizen ID already exists.' },
        { status: 409 }
      );
    }

    // Save to persistent JSON database
    saveMockUser(cccd, { cccd, password, role, fullName, dob, gender, doctorId });

    return NextResponse.json(
      { message: 'Registration successful.', success: true },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
