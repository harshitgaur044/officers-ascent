// seed.js - Run once to initialize database
import { db, collection, doc, setDoc, getDoc } from './firebase-config.js';

export async function seedDatabase() {
  try {
    // Check if already seeded
    const adminDoc = await getDoc(doc(db, 'admin', 'credentials'));
    if (adminDoc.exists()) {
      console.log('Database already seeded');
      return;
    }

    // Seed Admin
    await setDoc(doc(db, 'admin', 'credentials'), {
      username: 'Harshit Singh',
      password: 'admin@123',
      email: 'admin@officersascent.com'
    });

    // Seed Members (10 + 5 blank)
    const members = [
      { id: 'member1', name: 'Candidate 1', pin: '1001', tagline: '', profilePic: '', active: true },
      { id: 'member2', name: 'Candidate 2', pin: '1002', tagline: '', profilePic: '', active: true },
      { id: 'member3', name: 'Candidate 3', pin: '1003', tagline: '', profilePic: '', active: true },
      { id: 'member4', name: 'Candidate 4', pin: '1004', tagline: '', profilePic: '', active: true },
      { id: 'member5', name: 'Candidate 5', pin: '1005', tagline: '', profilePic: '', active: true },
      { id: 'member6', name: 'Candidate 6', pin: '1006', tagline: '', profilePic: '', active: true },
      { id: 'member7', name: 'Candidate 7', pin: '1007', tagline: '', profilePic: '', active: true },
      { id: 'member8', name: 'Candidate 8', pin: '1008', tagline: '', profilePic: '', active: true },
      { id: 'member9', name: 'Candidate 9', pin: '1009', tagline: '', profilePic: '', active: true },
      { id: 'member10', name: 'Candidate 10', pin: '1010', tagline: '', profilePic: '', active: true },
      { id: 'member11', name: '', pin: '1011', tagline: '', profilePic: '', active: false },
      { id: 'member12', name: '', pin: '1012', tagline: '', profilePic: '', active: false },
      { id: 'member13', name: '', pin: '1013', tagline: '', profilePic: '', active: false },
      { id: 'member14', name: '', pin: '1014', tagline: '', profilePic: '', active: false },
      { id: 'member15', name: '', pin: '1015', tagline: '', profilePic: '', active: false },
    ];

    for (const member of members) {
      await setDoc(doc(db, 'members', member.id), {
        name: member.name,
        pin: member.pin,
        tagline: member.tagline,
        profilePic: member.profilePic,
        active: member.active,
        createdAt: new Date().toISOString()
      });
    }

    // Seed default evaluation traits
    await setDoc(doc(db, 'settings', 'evalTraits'), {
      traits: ['Communication', 'Leadership', 'Confidence', 'Knowledge', 'Cooperation', 'Initiative']
    });

    // Seed site settings
    await setDoc(doc(db, 'settings', 'site'), {
      title: "The Officer's Ascent",
      subtitle: 'Turning Potential Into Leadership',
      heroImages: [
        'https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9?w=1600',
        'https://images.unsplash.com/photo-1612892483236-52d32a0e0ac1?w=1600',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600',
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1600'
      ],
      announcement: ''
    });

    // Seed default study material categories
    const categories = ['Psychology', 'TAT', 'WAT', 'SRT', 'GTO', 'Interview', 'Lecturette', 'Current Affairs'];
    await setDoc(doc(db, 'settings', 'studyCategories'), { categories });

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
  }
}
