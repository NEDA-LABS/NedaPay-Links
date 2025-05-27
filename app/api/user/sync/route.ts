// Sync user with Privy
import { NextResponse } from 'next/server';
import { syncPrivyUser } from '../../../utils/userService';

export async function POST(req: Request) {
  try {
    const { privyUser } = await req.json();

    if (!privyUser || !privyUser.id) {
      return NextResponse.json({ error: 'Invalid Privy user data' }, { status: 400 });
    }

    const user = await syncPrivyUser(privyUser);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}



